"use client";

import { twMerge } from "tailwind-merge";
import { HowItWorksBeams } from "@/sections/HowItWorksBeams";

const blocks = [
  {
    title: "NLP pipeline",
    body: [
      "Clean + normalize text",
      "Stopword removal + stemming",
      "CountVectorizer (bag-of-words)",
      "MinMaxScaler → model",
    ],
    tone: "default" as const,
  },
  {
    title: "Model",
    body: ["XGBoost classifier", "Binary sentiment (pos/neg)", "Deployed as Flask API (`api.py`)"],
    tone: "inverse" as const,
  },
  {
    title: "What the UI shows",
    body: [
      "Single text: tone (0–100), confidence, band",
      "Dataset: distribution chart + word clouds",
      "Download Predictions.csv",
    ],
    tone: "default" as const,
  },
];

export function MlNlpShowcase() {
  return (
    <section id="architecture" className="bg-white py-24">
      <div className="container">
        <div className="section-heading">
          <div className="flex justify-center">
            <div className="tag">Architecture</div>
          </div>
          <h2 className="section-title mt-5">How it works</h2>
          <p className="section-description mt-5">
            NLP preprocessing turns text into features, then the model scores sentiment. The demo below calls your Flask API.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10 items-center">
          <HowItWorksBeams />
          <div className="panel">
            <h3 className="text-xl font-bold">Connect inputs, deliver outputs</h3>
            <p className="text-black/70 mt-3 text-sm leading-6">
              Reviews flow through preprocessing (cleaning, stopwords, stemming) and become vectors via CountVectorizer.
              The trained XGBoost model then outputs probabilities, which we translate into a tone score, confidence, and
              dataset-level insights like distribution charts and word clouds.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl border border-black/10 p-4">
                <div className="font-semibold">Inputs</div>
                <div className="text-black/60 mt-1">Text / CSV-style batches</div>
              </div>
              <div className="rounded-2xl border border-black/10 p-4">
                <div className="font-semibold">Core</div>
                <div className="text-black/60 mt-1">Vectorizer + scaler + XGBoost</div>
              </div>
              <div className="rounded-2xl border border-black/10 p-4">
                <div className="font-semibold">Outputs</div>
                <div className="text-black/60 mt-1">Score, charts, word clouds</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
          {blocks.map((b) => (
            <div
              key={b.title}
              className={twMerge(
                "panel h-full",
                b.tone === "inverse" && "border-black bg-black text-white"
              )}
            >
              <h3
                className={twMerge(
                  "text-xl font-bold",
                  b.tone === "inverse" ? "text-white" : "text-black"
                )}
              >
                {b.title}
              </h3>
              <ul className={twMerge("mt-5 space-y-2 text-sm", b.tone === "inverse" ? "text-white/80" : "text-black/70")}>
                {b.body.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className={twMerge("mt-2 h-1.5 w-1.5 rounded-full", b.tone === "inverse" ? "bg-white/80" : "bg-black/50")} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

