"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const Circle = forwardRef<HTMLDivElement, { className?: string; children: React.ReactNode }>(function Circle(
  { className, children },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 border-black/10 bg-white p-2 shadow-[0_0_18px_-10px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {children}
    </div>
  );
});

const EmojiNode = ({ emoji, label }: { emoji: string; label: string }) => (
  <div className="flex flex-col items-center justify-center leading-none">
    <div className="text-[18px]">{emoji}</div>
    <div className="mt-1 text-[9px] font-semibold tracking-tight text-black/70">{label}</div>
  </div>
);

export function HowItWorksBeams({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reviewRef = useRef<HTMLDivElement | null>(null);
  const cleanRef = useRef<HTMLDivElement | null>(null);
  const stemRef = useRef<HTMLDivElement | null>(null);
  const vecRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<HTMLDivElement | null>(null);
  const toneRef = useRef<HTMLDivElement | null>(null);
  const insightsRef = useRef<HTMLDivElement | null>(null);
  const csvRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className={cn(
        "relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-3xl border border-[#222222]/10 bg-white p-6 shadow-[0_7px_14px_#EAEAEA] sm:p-10",
        className
      )}
      ref={containerRef}
    >
      <div className="flex size-full w-full flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <Circle ref={reviewRef} className="size-16">
            <EmojiNode emoji="📝" label="Review" />
          </Circle>
          <div className="text-[10px] text-black/50">input</div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="text-[10px] font-semibold tracking-tight text-black/50">NLP</div>
          <Circle ref={cleanRef} className="size-16">
            <EmojiNode emoji="🧹" label="Clean" />
          </Circle>
          <Circle ref={stemRef} className="size-16">
            <EmojiNode emoji="🔤" label="Stem" />
          </Circle>
          <Circle ref={vecRef} className="size-16">
            <EmojiNode emoji="🧩" label="Vectorize" />
          </Circle>
        </div>

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="text-[10px] font-semibold tracking-tight text-black/50">ML</div>
          <Circle ref={scaleRef} className="size-16">
            <EmojiNode emoji="📏" label="Scale" />
          </Circle>
          <Circle ref={modelRef} className="size-[76px] border-black/20">
            <EmojiNode emoji="⚙️" label="XGBoost" />
          </Circle>
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          <Circle ref={toneRef} className="size-16">
            <EmojiNode emoji="😊" label="Tone" />
          </Circle>
          <Circle ref={insightsRef} className="size-16">
            <EmojiNode emoji="📊" label="Insights" />
          </Circle>
          <Circle ref={csvRef} className="size-16">
            <EmojiNode emoji="⬇️" label="CSV" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam containerRef={containerRef} fromRef={reviewRef} toRef={cleanRef} duration={3} curvature={-18} />
      <AnimatedBeam containerRef={containerRef} fromRef={cleanRef} toRef={stemRef} duration={3} delay={0.1} curvature={-6} />
      <AnimatedBeam containerRef={containerRef} fromRef={stemRef} toRef={vecRef} duration={3} delay={0.2} curvature={6} />
      <AnimatedBeam containerRef={containerRef} fromRef={vecRef} toRef={scaleRef} duration={3} delay={0.3} curvature={12} />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={scaleRef}
        toRef={modelRef}
        duration={3}
        delay={0.4}
        gradientStartColor="#111111"
        gradientStopColor="#111111"
        curvature={12}
      />

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={modelRef}
        toRef={toneRef}
        duration={3}
        gradientStartColor="#8b5cf6"
        gradientStopColor="#ec4899"
        curvature={-18}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={modelRef}
        toRef={insightsRef}
        duration={3}
        delay={0.15}
        gradientStartColor="#8b5cf6"
        gradientStopColor="#ec4899"
        curvature={0}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={modelRef}
        toRef={csvRef}
        duration={3}
        delay={0.3}
        gradientStartColor="#8b5cf6"
        gradientStopColor="#ec4899"
        curvature={18}
      />
    </div>
  );
}

