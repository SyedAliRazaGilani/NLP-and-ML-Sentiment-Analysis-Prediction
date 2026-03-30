"use client";

import { useState } from "react";

import { Header } from "@/sections/Header";
import { Hero } from "@/sections/Hero";
import { LogoTicker } from "@/sections/LogoTicker";
import { ProductShowcase } from "@/sections/ProductShowcase";
import { Pricing } from "@/sections/Pricing";
import { PredictInline, type PredictMode } from "@/sections/PredictInline";
import { MlNlpShowcase } from "@/sections/MlNlpShowcase";
import { CallToAction } from "@/sections/CallToAction";
import { Footer } from "@/sections/Footer";

export default function Home() {
  const [mode, setMode] = useState<PredictMode | null>(null);

  return (
    <>
      <Header />
      <Hero />
      <LogoTicker />
      <ProductShowcase />
      <Pricing onSelectMode={setMode} scrollTargetId="predict" />
      <PredictInline mode={mode} anchorId="predict" />
      <MlNlpShowcase />
      <CallToAction />
      <Footer />
    </>
  );
}
