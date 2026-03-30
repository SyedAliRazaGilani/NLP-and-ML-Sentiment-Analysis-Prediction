from flask import Flask, request, jsonify, send_file
import os
import re
import json
import time
import uuid
import random
from io import BytesIO

import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
import matplotlib.pyplot as plt
import pandas as pd
import pickle
import base64
from dotenv import load_dotenv

# When you run `python api.py`, Flask's default root is cwd — not this file's folder.
# That loads the WRONG templates/ and breaks if you start the app from Desktop etc.
_APP_ROOT = os.path.dirname(os.path.abspath(__file__))
_MODEL_DIR = os.path.join(_APP_ROOT, "Models")
_LANDING_HTML = os.path.join(_APP_ROOT, "templates", "landing.html")
_UI_BUILD = "sentiment-ui-2026-03-30"

# Fresh servers (e.g. Render) have no NLTK corpora; download into the app dir (writable).
_NLTK_DATA = os.path.join(_APP_ROOT, "nltk_data")
os.makedirs(_NLTK_DATA, exist_ok=True)
if _NLTK_DATA not in nltk.data.path:
    nltk.data.path.insert(0, _NLTK_DATA)
nltk.download("stopwords", download_dir=_NLTK_DATA, quiet=True)

STOPWORDS = set(stopwords.words("english"))

load_dotenv(os.path.join(_APP_ROOT, ".env"), override=False)

_DEMO_STORE = {}
_DEMO_TTL_SECONDS = 60 * 30

app = Flask(
    __name__,
    root_path=_APP_ROOT,
    template_folder=os.path.join(_APP_ROOT, "templates"),
)


@app.after_request
def _disable_cache_for_html(response):
    if request.path in ("/", "/app") and response.mimetype and "html" in response.mimetype:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["X-Sentiment-UI-Build"] = _UI_BUILD
    return response


def _demo_gc():
    now = time.time()
    dead = [k for k, v in _DEMO_STORE.items() if (now - v.get("created_at", now)) > _DEMO_TTL_SECONDS]
    for k in dead:
        _DEMO_STORE.pop(k, None)


def _groq_api_key():
    return os.environ.get("GROQ_API_KEY") or os.environ.get("GROQ_API_TOKEN")


def _groq_model():
    return os.environ.get("GROQ_MODEL") or "llama-3.1-8b-instant"


def generate_reviews_via_groq(n: int, scenario: str, seed: int | None = None):
    """
    Uses Groq's OpenAI-compatible API to generate review-like sentences.
    Returns a list[str].
    """
    import requests

    key = _groq_api_key()
    if not key:
        raise RuntimeError(
            "Missing GROQ_API_KEY. Create a local .env file (ignored by git) and set GROQ_API_KEY=..."
        )

    # Large n can exceed completion budget before valid JSON is closed.
    n = int(max(5, min(n, 120)))
    if seed is None:
        seed = random.randint(1, 1_000_000_000)

    system = (
        "You generate realistic customer reviews for a smart speaker (Alexa/Echo) product.\n"
        "Return ONLY valid JSON. No markdown, no prose."
    )

    def _prompt(nn: int, sd: int):
        return (
            f"Generate {nn} distinct customer review sentences for this scenario: {scenario}.\n"
            "Constraints:\n"
            "- Each item is 8–22 words (review-like, not a single word).\n"
            "- Mix of praise/complaints appropriate to the scenario.\n"
            "- Include realistic topics: setup, wifi, microphone, music, smart home, returns, defects.\n"
            "- Avoid profanity.\n"
            f"- Use this random seed for variety: {sd}\n"
            "Output JSON object with this exact shape:\n"
            "{\"reviews\": [\"...\", \"...\", ...]}\n"
        )

    url = "https://api.groq.com/openai/v1/chat/completions"
    last_err = None
    # Retry with smaller nn if JSON can't be completed in time.
    for attempt, nn in enumerate([min(n, 50), min(n, 35), min(n, 25), min(n, 15)], start=1):
        temp = 0.7 if attempt > 1 else 1.0
        max_tokens = 900

        payload = {
            "model": _groq_model(),
            "temperature": temp,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": _prompt(nn, seed)},
            ],
            "response_format": {"type": "json_object"},
        }

        r = requests.post(
            url,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json=payload,
            timeout=60,
        )
        if r.status_code >= 400:
            # If Groq cannot validate JSON within token budget, try smaller nn.
            try:
                err = r.json().get("error", {})
                code = err.get("code")
            except Exception:
                code = None
            last_err = f"Groq API error {r.status_code}: {r.text[:400]}"
            if code == "json_validate_failed":
                continue
            continue

        data = r.json()
        content = data["choices"][0]["message"]["content"]
        try:
            parsed = json.loads(content)
        except Exception as e:
            last_err = f"Groq returned non-JSON content: {content[:300]}"
            continue

        # Groq json_object response_format may wrap arrays; accept either.
        if isinstance(parsed, dict):
            for k in ("reviews", "items", "sentences", "data"):
                if k in parsed:
                    parsed = parsed[k]
                    break

        if not isinstance(parsed, list):
            last_err = f"Groq returned unexpected JSON shape: {type(parsed).__name__}"
            continue

        reviews = []
        for x in parsed:
            if isinstance(x, str) and x.strip():
                reviews.append(x.strip())
        if len(reviews) < 3:
            last_err = "Groq returned too few reviews."
            continue

        return reviews, seed

    raise RuntimeError(last_err or "Groq generation failed.")

    # unreachable (handled in retry loop)


def preprocess_review_text(raw: str) -> str:
    stemmer = PorterStemmer()
    review = re.sub("[^a-zA-Z]", " ", raw)
    review = review.lower().split()
    review = [stemmer.stem(word) for word in review if word not in STOPWORDS]
    return " ".join(review)


def proba_pos_neg(predictor, proba_row):
    """Map predict_proba row to P(negative), P(positive) using model.classes_."""
    classes = list(getattr(predictor, "classes_", [0, 1]))
    d = {int(c): float(p) for c, p in zip(classes, proba_row)}
    return d.get(0, 0.0), d.get(1, 0.0)


def interpret_tone(p_neg: float, p_pos: float, raw_text: str = ""):
    """
    Rich labels for UI: score, confidence, tone band, customer-facing copy.
    """
    margin = abs(p_pos - p_neg)
    if margin < 0.22:
        tone_band = "Mixed / unclear"
        customer_tone = "Mixed tone"
    elif p_pos > p_neg:
        tone_band = "Mostly positive"
        customer_tone = "Sounds satisfied"
    else:
        tone_band = "Mostly negative"
        customer_tone = "Sounds frustrated"

    p_max = max(p_neg, p_pos)
    if p_max >= 0.78:
        confidence = "high"
    elif p_max >= 0.58:
        confidence = "medium"
    else:
        confidence = "low"

    positive_tone_0_100 = round(100 * p_pos, 1)
    prediction = "Positive" if p_pos >= p_neg else "Negative"

    words = len(raw_text.split()) if raw_text else 0
    reliability_note = None
    if words < 4 or len(raw_text.strip()) < 25:
        reliability_note = (
            "Short text is harder to score reliably — try a full sentence "
            "(like a real product review) for a steadier reading."
        )

    return {
        "prediction": prediction,
        "positive_tone_0_100": positive_tone_0_100,
        "p_negative": round(p_neg, 4),
        "p_positive": round(p_pos, 4),
        "confidence": confidence,
        "tone_band": tone_band,
        "customer_tone": customer_tone,
        "reliability_note": reliability_note,
    }


@app.route("/test", methods=["GET"])
def test():
    return (
        f"OK - {_UI_BUILD}\n"
        f"app_root={_APP_ROOT}\n"
        f"landing={_LANDING_HTML}\n"
        f"landing_exists={os.path.isfile(_LANDING_HTML)}\n"
    )


@app.route("/debug/ui-version", methods=["GET"])
def debug_ui_version():
    """Open this in the browser to confirm which template file Flask is serving."""
    p = _LANDING_HTML
    try:
        mtime = os.path.getmtime(p)
    except OSError:
        mtime = None
    return jsonify(
        app_root=_APP_ROOT,
        landing_template=p,
        landing_mtime=mtime,
        ui_build=_UI_BUILD,
        hint="If this path is not your Cursor project folder, you are running a different copy of the code.",
    )


@app.route("/debug/groq", methods=["GET"])
def debug_groq():
    return jsonify(
        groq_key_present=bool(_groq_api_key()),
        groq_model=_groq_model(),
        demo_store_items=len(_DEMO_STORE),
    )


def _serve_landing():
    """Serve HTML from disk (absolute path). Avoids any wrong template search path."""
    if not os.path.isfile(_LANDING_HTML):
        return (
            f"<pre>Missing landing page at:\n{_LANDING_HTML}\n\n"
            f"app root:\n{_APP_ROOT}</pre>",
            500,
            {"Content-Type": "text/html; charset=utf-8"},
        )
    return send_file(
        _LANDING_HTML,
        mimetype="text/html; charset=utf-8",
        max_age=0,
        etag=False,
        conditional=False,
    )


@app.route("/", methods=["GET", "POST"])
def home():
    return _serve_landing()


@app.route("/app", methods=["GET", "POST"])
def home_alias():
    """Alternate URL if something else is intercepting `/`."""
    return _serve_landing()


@app.route("/predict", methods=["POST"])
def predict():
    try:
        predictor = pickle.load(open(os.path.join(_MODEL_DIR, "model_xgb.pkl"), "rb"))
        scaler = pickle.load(open(os.path.join(_MODEL_DIR, "scaler.pkl"), "rb"))
        cv = pickle.load(open(os.path.join(_MODEL_DIR, "countVectorizer.pkl"), "rb"))

        if "file" in request.files and request.files["file"].filename:
            file = request.files["file"]
            data = pd.read_csv(file)

            predictions, graph = bulk_prediction(predictor, scaler, cv, data)

            response = send_file(
                predictions,
                mimetype="text/csv",
                as_attachment=True,
                download_name="Predictions.csv",
            )

            response.headers["X-Graph-Exists"] = "true"

            response.headers["X-Graph-Data"] = base64.b64encode(
                graph.getbuffer()
            ).decode("ascii")

            return response

        # Next.js proxy sends JSON; use get_json so we never fall through with no return.
        body = request.get_json(silent=True) or {}
        if isinstance(body, dict) and "text" in body:
            text_input = body["text"]
            out = single_prediction_payload(predictor, scaler, cv, text_input)
            return jsonify(out)

        return (
            jsonify(
                {
                    "error": "Expected JSON {\"text\": \"...\"} or a CSV file upload.",
                    "hint": "POST JSON with Content-Type: application/json",
                }
            ),
            400,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/demo/generate", methods=["POST"])
def demo_generate():
    """
    Generate a fresh demo CSV using Groq and keep it server-side for later download/predict.
    Body: { "n": 50, "scenario": "mostly positive...", "seed": 123 }
    """
    try:
        _demo_gc()
        body = request.json or {}
        n = int(body.get("n", 35))
        scenario = str(body.get("scenario", "Mixed household usage: mostly positive with a few complaints."))
        seed = body.get("seed", None)
        if seed is not None:
            seed = int(seed)

        reviews, used_seed = generate_reviews_via_groq(n=n, scenario=scenario, seed=seed)
        df = pd.DataFrame({"Sentence": reviews})
        demo_id = uuid.uuid4().hex
        _DEMO_STORE[demo_id] = {"created_at": time.time(), "seed": used_seed, "scenario": scenario, "df": df}

        preview = reviews[:5]
        return jsonify(
            id=demo_id,
            seed=used_seed,
            scenario=scenario,
            rows=len(reviews),
            preview=preview,
            download_url=f"/demo/download?id={demo_id}",
            predict_url=f"/demo/predict?id={demo_id}",
        )
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/demo/download", methods=["GET"])
def demo_download():
    try:
        _demo_gc()
        demo_id = request.args.get("id", "")
        item = _DEMO_STORE.get(demo_id)
        if not item:
            return jsonify({"error": "Demo not found (expired). Generate again."}), 404

        out = BytesIO()
        item["df"].to_csv(out, index=False)
        out.seek(0)
        return send_file(out, mimetype="text/csv", as_attachment=True, download_name="DemoReviews.csv")
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/demo/predict", methods=["POST"])
def demo_predict():
    try:
        _demo_gc()
        demo_id = request.args.get("id", "")
        item = _DEMO_STORE.get(demo_id)
        if not item:
            return jsonify({"error": "Demo not found (expired). Generate again."}), 404

        predictor = pickle.load(open(os.path.join(_MODEL_DIR, "model_xgb.pkl"), "rb"))
        scaler = pickle.load(open(os.path.join(_MODEL_DIR, "scaler.pkl"), "rb"))
        cv = pickle.load(open(os.path.join(_MODEL_DIR, "countVectorizer.pkl"), "rb"))

        # Build predictions + analysis and store server-side, then return URLs.
        df_in = item["df"].copy()
        predictions_csv, graph = bulk_prediction(predictor, scaler, cv, df_in)

        # Store predictions CSV bytes
        predictions_bytes = predictions_csv.getvalue()
        item["predictions_bytes"] = predictions_bytes

        # Store graph PNG bytes
        graph.seek(0)
        item["graph_png_bytes"] = graph.getvalue()

        # Extra analysis (optional): word clouds + stats (store as bytes/JSON, not headers)
        stats = None
        try:
            from wordcloud import WordCloud
            import numpy as np

            processed = [preprocess_review_text(str(x)) for x in df_in["Sentence"].tolist()]
            X_counts = cv.transform(processed)
            X_dense = X_counts.toarray()
            X_scaled = scaler.transform(X_dense)
            probas = predictor.predict_proba(X_scaled)
            p_pos = [proba_pos_neg(predictor, probas[i])[1] for i in range(probas.shape[0])]

            df_in["_pred"] = df_in["Predicted sentiment"].astype(str)
            pos_df = df_in[df_in["_pred"] == "Positive"]
            neg_df = df_in[df_in["_pred"] == "Negative"]

            def wc_bytes(text: str):
                if not text.strip():
                    return None
                wc = WordCloud(width=700, height=450, background_color="white", colormap="viridis").generate(text)
                fig = plt.figure(figsize=(7, 4.5))
                plt.imshow(wc, interpolation="bilinear")
                plt.axis("off")
                buf = BytesIO()
                plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0.1)
                plt.close(fig)
                return buf.getvalue()

            pos_text = " ".join(pos_df["Sentence"].astype(str).tolist())
            neg_text = " ".join(neg_df["Sentence"].astype(str).tolist())
            item["wc_pos_png_bytes"] = wc_bytes(pos_text)
            item["wc_neg_png_bytes"] = wc_bytes(neg_text)

            feat = cv.get_feature_names_out()
            top_pos = []
            top_neg = []
            if len(feat) == X_counts.shape[1]:
                idx_pos = np.array(df_in["_pred"].values) == "Positive"
                idx_neg = np.array(df_in["_pred"].values) == "Negative"
                if idx_pos.any():
                    sums = np.asarray(X_counts[idx_pos].sum(axis=0)).ravel()
                    top_pos = [feat[i] for i in sums.argsort()[-10:][::-1] if sums[i] > 0][:10]
                if idx_neg.any():
                    sums = np.asarray(X_counts[idx_neg].sum(axis=0)).ravel()
                    top_neg = [feat[i] for i in sums.argsort()[-10:][::-1] if sums[i] > 0][:10]

            conf = df_in["Confidence"].astype(str).value_counts().to_dict()
            stats = {
                "rows": int(df_in.shape[0]),
                "pos_count": int((df_in["_pred"] == "Positive").sum()),
                "neg_count": int((df_in["_pred"] == "Negative").sum()),
                "avg_tone": round(float(df_in["Positive tone (0-100)"].mean()), 1) if df_in.shape[0] else 0.0,
                "conf_high": int(conf.get("high", 0)),
                "conf_med": int(conf.get("medium", 0)),
                "conf_low": int(conf.get("low", 0)),
                "top_pos": top_pos,
                "top_neg": top_neg,
            }
            item["stats"] = stats
        except Exception:
            item["stats"] = None

        return jsonify(
            id=demo_id,
            rows=int(item["df"].shape[0]),
            stats=item.get("stats"),
            predictions_url=f"/demo/predictions?id={demo_id}",
            graph_url=f"/demo/graph?id={demo_id}",
            wc_pos_url=f"/demo/wordcloud/pos?id={demo_id}",
            wc_neg_url=f"/demo/wordcloud/neg?id={demo_id}",
        )
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/demo/predictions", methods=["GET"])
def demo_predictions():
    _demo_gc()
    demo_id = request.args.get("id", "")
    item = _DEMO_STORE.get(demo_id)
    if not item or not item.get("predictions_bytes"):
        return jsonify({"error": "Predictions not found. Run demo prediction first."}), 404
    out = BytesIO(item["predictions_bytes"])
    return send_file(out, mimetype="text/csv", as_attachment=True, download_name="Predictions.csv")


@app.route("/demo/graph", methods=["GET"])
def demo_graph():
    _demo_gc()
    demo_id = request.args.get("id", "")
    item = _DEMO_STORE.get(demo_id)
    b = item.get("graph_png_bytes") if item else None
    if not b:
        return jsonify({"error": "Graph not found. Run demo prediction first."}), 404
    return send_file(BytesIO(b), mimetype="image/png", as_attachment=False, download_name="sentiment_pie.png")


@app.route("/demo/wordcloud/pos", methods=["GET"])
def demo_wc_pos():
    _demo_gc()
    demo_id = request.args.get("id", "")
    item = _DEMO_STORE.get(demo_id)
    b = item.get("wc_pos_png_bytes") if item else None
    if not b:
        return jsonify({"error": "Word cloud not found. Run demo prediction first."}), 404
    return send_file(BytesIO(b), mimetype="image/png", as_attachment=False, download_name="wordcloud_pos.png")


@app.route("/demo/wordcloud/neg", methods=["GET"])
def demo_wc_neg():
    _demo_gc()
    demo_id = request.args.get("id", "")
    item = _DEMO_STORE.get(demo_id)
    b = item.get("wc_neg_png_bytes") if item else None
    if not b:
        return jsonify({"error": "Word cloud not found. Run demo prediction first."}), 404
    return send_file(BytesIO(b), mimetype="image/png", as_attachment=False, download_name="wordcloud_neg.png")


def single_prediction_payload(predictor, scaler, cv, text_input):
    processed = preprocess_review_text(text_input)
    corpus = [processed]
    X_prediction = cv.transform(corpus).toarray()
    X_prediction_scl = scaler.transform(X_prediction)
    row = predictor.predict_proba(X_prediction_scl)[0]
    p_neg, p_pos = proba_pos_neg(predictor, row)
    meta = interpret_tone(p_neg, p_pos, raw_text=text_input)
    meta["processed_token_preview"] = processed[:200] + ("…" if len(processed) > 200 else "")
    return meta


def bulk_prediction(predictor, scaler, cv, data):
    corpus = []
    for i in range(0, data.shape[0]):
        corpus.append(preprocess_review_text(str(data.iloc[i]["Sentence"])))

    X_prediction = cv.transform(corpus).toarray()
    X_prediction_scl = scaler.transform(X_prediction)
    probas = predictor.predict_proba(X_prediction_scl)

    preds = []
    scores = []
    confidences = []
    bands = []
    tones = []
    notes = []

    for i in range(probas.shape[0]):
        p_neg, p_pos = proba_pos_neg(predictor, probas[i])
        raw = str(data.iloc[i]["Sentence"])
        meta = interpret_tone(p_neg, p_pos, raw_text=raw)
        preds.append(meta["prediction"])
        scores.append(meta["positive_tone_0_100"])
        confidences.append(meta["confidence"])
        bands.append(meta["tone_band"])
        tones.append(meta["customer_tone"])
        notes.append(meta["reliability_note"] or "")

    data["Predicted sentiment"] = preds
    data["Positive tone (0-100)"] = scores
    data["Confidence"] = confidences
    data["Tone band"] = bands
    data["Customer tone"] = tones
    data["Reliability note"] = notes

    predictions_csv = BytesIO()
    data.to_csv(predictions_csv, index=False)
    predictions_csv.seek(0)

    graph = get_distribution_graph(data)

    return predictions_csv, graph


def get_distribution_graph(data):
    fig = plt.figure(figsize=(5, 5))
    colors = ("green", "red")
    wp = {"linewidth": 1, "edgecolor": "black"}
    tags = data["Predicted sentiment"].value_counts()
    explode = (0.01,) * len(tags)

    tags.plot(
        kind="pie",
        autopct="%1.1f%%",
        shadow=True,
        colors=colors[: len(tags)],
        startangle=90,
        wedgeprops=wp,
        explode=explode,
        title="Sentiment distribution (batch)",
        xlabel="",
        ylabel="",
    )

    graph = BytesIO()
    plt.savefig(graph, format="png")
    plt.close()

    return graph


def _print_boot_banner():
    import sys

    print("\n" + "=" * 64, file=sys.stderr)
    print(" SENTIMENT-ANALYSIS — Flask", file=sys.stderr)
    print(" UI build:  ", _UI_BUILD, file=sys.stderr)
    print(" app_root:  ", _APP_ROOT, file=sys.stderr)
    print(" landing:   ", _LANDING_HTML, file=sys.stderr)
    print(" exists:    ", os.path.isfile(_LANDING_HTML), file=sys.stderr)
    print(" Open:       http://127.0.0.1:5000/test  (must mention build id)", file=sys.stderr)
    print(" If /test shows OLD text, another program owns port 5000.", file=sys.stderr)
    print("=" * 64 + "\n", file=sys.stderr)


_print_boot_banner()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=True)
