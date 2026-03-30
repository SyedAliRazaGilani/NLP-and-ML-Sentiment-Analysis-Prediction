"use client";
import CheckIcon from "@/assets/check.svg";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import type { PredictMode } from "@/sections/PredictInline";

const pricingTiers = [
  {
    title: "Dataset Sentiment Prediction",
    blurb: "Generate a demo dataset, run batch scoring, then explore insights.",
    buttonText: "Start dataset analysis",
    popular: true,
    inverse: true,
    features: [
      "Generate demo reviews (Groq)",
      "Batch scoring + metrics",
      "Pie chart + word clouds",
      "Download Predictions.csv",
    ],
  },
  {
    title: "Text Sentiment Prediction",
    blurb: "Score one review sentence and get tone + confidence instantly.",
    buttonText: "Start single text",
    popular: false,
    inverse: false,
    features: [
      "Tone score (0–100) + confidence",
      "Example review buttons",
      "Fast scoring via Flask API",
      "Same-origin calls (no CORS)",
    ],
  },
];

export const Pricing = ({
  onSelectMode,
  scrollTargetId = "predict",
}: {
  onSelectMode?: (mode: PredictMode) => void;
  scrollTargetId?: string;
}) => {
  const handleCta = (title: string) => {
    const mode: PredictMode = title.toLowerCase().includes("dataset") ? "dataset" : "text";
    onSelectMode?.(mode);
    const el = typeof document !== "undefined" ? document.getElementById(scrollTargetId) : null;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="demo" className="py-24 bg-white">
      <div className="container">
        <div className="section-heading">
          <h2 className="section-title">Demo</h2>
          <p className="section-description mt-5">
            Choose what you want to test: score one sentence, or generate a dataset and explore charts + word clouds.
          </p>
        </div>
        <div className="flex flex-col gap-6 items-center mt-10 lg:flex-row lg:items-stretch lg:justify-center">
          {pricingTiers.map(
            ({
              title,
              blurb,
              buttonText,
              popular,
              inverse,
              features,
            }) => (
              <div
                key={title}
                className={twMerge(
                  "card glow-border max-w-md min-h-[440px] bg-white",
                  inverse === true && "border-black bg-black text-white"
                )}
              >
                <div className="flex justify-between">
                  <h3
                    className={twMerge(
                      "text-lg font-bold text-black/50",
                      inverse === true && "text-white/60"
                    )}
                  >
                    {title}
                  </h3>
                  {popular === true && (
                    <div className="inline-flex text-sm px-4 py-1.5 rounded-xl border border-white/20">
                      <motion.span
                        animate={{
                          backgroundPositionX: "100%",
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                          repeatType: "loop",
                        }}
                        className="bg-[linear-gradient(to_right,#DD7DDF,#E1CD86,#BBCB92,#71C2EF,#3BFFFF,#DD7DDF,#E1CD86,#BBCB92,#71C2EF,#3BFFFF,#DD7DDF)] [background-size:200%] text-transparent bg-clip-text font-medium"
                      >
                        Popular
                      </motion.span>
                    </div>
                  )}
                </div>
                <p className={twMerge("mt-4 text-sm leading-6", inverse ? "text-white/75" : "text-black/60")}>
                  {blurb}
                </p>
                <button
                  className={twMerge(
                    "btn btn-primary w-full mt-[30px]",
                    inverse === true && "bg-white text-black"
                  )}
                  onClick={() => handleCta(title)}
                >
                  {buttonText}
                </button>
                <ul className="flex flex-col gap-5 mt-8">
                  {features.map((feature) => (
                    <li key={feature} className="text-sm flex items-center gap-4">
                      <CheckIcon className="h-6 w-6" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
};
