"use client";

import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

export type PredictMode = "text" | "dataset";

const EXAMPLES = [
  "Love the Echo—sound is great and setup was easy.",
  "Terrible product, complete waste of money—I already returned it.",
  "Sometimes Alexa misunderstands commands but overall it is fine for our kitchen.",
  "Setup was frustrating and the Wi‑Fi keeps dropping, but when it works the sound is okay.",
];

export function PredictInline({
  mode,
  anchorId = "predict",
}: {
  mode: PredictMode | null;
  anchorId?: string;
}) {
  // Single text
  const [text, setText] = useState("");
  const [textLoading, setTextLoading] = useState(false);
  const [textResult, setTextResult] = useState<any>(null);

  // Dataset
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMeta, setDemoMeta] = useState<any>(null); // includes id, preview, urls
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisMeta, setAnalysisMeta] = useState<any>(null); // includes graph_url, stats, wc urls

  const demoId = demoMeta?.id as string | undefined;

  const parseJsonSafe = async (r: Response) => {
    const raw = await r.text();
    if (!raw.trim()) {
      return {
        error: `Empty response (HTTP ${r.status}). Start Flask on port 5000 (Sentiment-Analysis-main) or set FLASK_BASE_URL.`,
      };
    }
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { error: `Invalid JSON (HTTP ${r.status}): ${raw.slice(0, 200)}` };
    }
  };

  const scoreText = async () => {
    const v = text.trim();
    if (!v) return;
    setTextLoading(true);
    setTextResult(null);
    try {
      const r = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: v }),
      });
      const j = await parseJsonSafe(r);
      setTextResult(j);
    } catch (e: unknown) {
      setTextResult({ error: e instanceof Error ? e.message : "Network error — is Flask running?" });
    } finally {
      setTextLoading(false);
    }
  };

  const generateDemo = async () => {
    setDemoLoading(true);
    setDemoMeta(null);
    setAnalysisMeta(null);
    try {
      const r = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          n: 35,
          scenario: "Mixed household usage: mostly positive with a handful of setup/wifi issues and a few returns.",
        }),
      });
      const j = await parseJsonSafe(r);
      setDemoMeta(j);
    } catch (e: unknown) {
      setDemoMeta({ error: e instanceof Error ? e.message : "Network error — is Flask running?" });
    } finally {
      setDemoLoading(false);
    }
  };

  const runDatasetAnalysis = async () => {
    if (!demoId) return;
    setAnalysisLoading(true);
    setAnalysisMeta(null);
    try {
      const r = await fetch(`/api/demo/predict?id=${encodeURIComponent(demoId)}`, { method: "POST" });
      const j = await parseJsonSafe(r);
      setAnalysisMeta(j);
    } catch (e: unknown) {
      setAnalysisMeta({ error: e instanceof Error ? e.message : "Network error — is Flask running?" });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const graphUrl = analysisMeta?.graph_url ? `/api${analysisMeta.graph_url}&t=${Date.now()}` : null;
  const wcPosUrl = analysisMeta?.wc_pos_url ? `/api${analysisMeta.wc_pos_url}&t=${Date.now()}` : null;
  const wcNegUrl = analysisMeta?.wc_neg_url ? `/api${analysisMeta.wc_neg_url}&t=${Date.now()}` : null;
  const predictionsUrl = analysisMeta?.predictions_url ? `/api${analysisMeta.predictions_url}` : null;
  const demoDownloadUrl = demoMeta?.download_url ? `/api${demoMeta.download_url}` : null;

  const tone = useMemo(() => {
    if (!textResult || textResult.error) return null;
    return {
      score: textResult.positive_tone_0_100 as number,
      confidence: textResult.confidence as string,
      band: textResult.tone_band as string,
      customer: textResult.customer_tone as string,
      ppos: textResult.p_positive as number,
    };
  }, [textResult]);

  return (
    <section id={anchorId} className={twMerge("bg-white", mode ? "py-8" : "py-0")}>
      <div className="container">
        {!mode ? null : (
          <div className="mt-6">
            {mode === "text" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <div className="panel">
                  <h3 className="text-lg font-bold">Single text sentiment analysis</h3>
                  <p className="text-black/60 mt-2">Paste one sentence and get a tone score + confidence.</p>

                  <textarea
                    className="mt-4 w-full rounded-lg border border-black/10 p-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
                    rows={6}
                    placeholder="Paste a review-style sentence…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />

                  <p className="text-sm text-black/60 mt-4 font-semibold">Examples</p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {EXAMPLES.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        className="text-left rounded-lg border border-black/10 bg-white p-3 text-xs hover:bg-black/[0.02]"
                        onClick={() => setText(ex)}
                      >
                        <div className="font-bold text-black">Example {i + 1}</div>
                        <div className="text-black/60 mt-1">{ex}</div>
                      </button>
                    ))}
                  </div>

                  <button className="btn btn-primary w-full mt-6" onClick={scoreText} disabled={textLoading}>
                    {textLoading ? "Scoring…" : "Score this text"}
                  </button>
                </div>

                <div className="panel">
                  <h3 className="text-lg font-bold">Single text result</h3>
                  {!textResult && <p className="text-black/60 mt-3">Run “Score this text” to see results.</p>}
                  {textResult?.error && <p className="text-red-600 mt-3">{String(textResult.error)}</p>}
                  {tone && (
                    <div className="mt-5">
                      <p className="text-sm text-black/60">Positive tone</p>
                      <div className="mt-2 h-2 w-full rounded-full bg-black/10 overflow-hidden">
                        <div
                          className="h-full bg-black"
                          style={{ width: `${Math.max(0, Math.min(100, tone.score))}%` }}
                        />
                      </div>
                      <div className="text-3xl font-bold mt-3">{tone.score} / 100</div>
                      <div className="flex flex-wrap gap-2 mt-4 text-xs">
                        <span className="rounded-full border border-black/10 px-3 py-1">
                          Confidence: {tone.confidence}
                        </span>
                        <span className="rounded-full border border-black/10 px-3 py-1">{tone.band}</span>
                      </div>
                      <p className="mt-4 font-semibold">{tone.customer}</p>
                      <p className="text-xs text-black/60 mt-1">P(pos) ≈ {tone.ppos}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mode === "dataset" && (
              <div className="panel">
                <h3 className="text-lg font-bold">Dataset analysis (generated new every time by Groq AI)</h3>
                <p className="text-black/60 mt-2">
                  Generate a realistic review dataset, then run batch scoring to produce charts + word clouds + a
                  downloadable CSV.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button className="btn btn-primary" onClick={generateDemo} disabled={demoLoading}>
                      {demoLoading ? "Generating…" : "Generate demo reviews"}
                    </button>
                    <button
                      className={twMerge("btn btn-primary", !demoId && "opacity-50")}
                      onClick={runDatasetAnalysis}
                      disabled={!demoId || analysisLoading}
                    >
                      {analysisLoading ? "Running…" : "Sentiment Analysis and Prediction"}
                    </button>
                  </div>
                  <a
                    className={twMerge("btn btn-primary", !demoDownloadUrl && "pointer-events-none opacity-50")}
                    href={demoDownloadUrl || "#"}
                  >
                    Download demo CSV
                  </a>
                </div>

                {demoMeta?.preview && (
                  <div className="mt-6 text-sm">
                    <div className="font-semibold">Preview</div>
                    <ul className="mt-2 list-disc pl-5 text-black/70 space-y-1">
                      {demoMeta.preview.slice(0, 5).map((p: string, idx: number) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisMeta?.error && <p className="text-red-600 mt-6">{String(analysisMeta.error)}</p>}

                {analysisMeta && !analysisMeta.error && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
                    <div className="panel">
                      <h4 className="font-bold">Predicted distribution</h4>
                      {graphUrl && (
                        <img className="mt-4 rounded-lg border border-black/10" src={graphUrl} alt="Pie chart" />
                      )}
                    </div>
                    <div className="panel">
                      <h4 className="font-bold">Key metrics</h4>
                      {analysisMeta.stats ? (
                        <ul className="mt-4 text-sm text-black/70 space-y-1">
                          <li>Rows: {analysisMeta.stats.rows}</li>
                          <li>
                            Positive: {analysisMeta.stats.pos_count} · Negative: {analysisMeta.stats.neg_count}
                          </li>
                          <li>Avg tone: {analysisMeta.stats.avg_tone}</li>
                          <li>
                            Confidence: high {analysisMeta.stats.conf_high} · med {analysisMeta.stats.conf_med} · low{" "}
                            {analysisMeta.stats.conf_low}
                          </li>
                          {analysisMeta.stats.top_pos?.length ? (
                            <li className="pt-2">Top tokens (pos): {analysisMeta.stats.top_pos.join(", ")}</li>
                          ) : null}
                          {analysisMeta.stats.top_neg?.length ? (
                            <li>Top tokens (neg): {analysisMeta.stats.top_neg.join(", ")}</li>
                          ) : null}
                        </ul>
                      ) : (
                        <p className="text-black/60 mt-3">Stats unavailable.</p>
                      )}

                      {predictionsUrl && (
                        <a className="btn btn-primary w-full mt-6" href={predictionsUrl}>
                          Download Predictions.csv
                        </a>
                      )}
                    </div>

                    <div className="panel">
                      <h4 className="font-bold">Word cloud (positive)</h4>
                      {wcPosUrl && (
                        <img
                          className="mt-4 rounded-lg border border-black/10"
                          src={wcPosUrl}
                          alt="Wordcloud positive"
                        />
                      )}
                    </div>
                    <div className="panel">
                      <h4 className="font-bold">Word cloud (negative)</h4>
                      {wcNegUrl && (
                        <img
                          className="mt-4 rounded-lg border border-black/10"
                          src={wcNegUrl}
                          alt="Wordcloud negative"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

