"use client";
import ArrowIcon from "@/assets/arrow-right.svg";
import cogImage from "@/assets/cog.png";
import cylinderImage from "@/assets/cylinder.png";
import noodleImage from "@/assets/noodle.png";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { useRef } from "react";

export const Hero = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start end", "end start"],
  });
  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const scrollToId = (id: string) => {
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={heroRef}
      id="home"
      className="pt-8 pb-20 md:pt-5 md:pb-10 bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#183EC2,#EAEEFE_100%)] overflow-x-clip"
    >
      <div className="container">
        <div className="md:flex items-center">
          <div className="md:w-[478px]">
            <div className="tag">Sentiment automation for customer feedback</div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-black to-[#001E80] text-transparent bg-clip-text mt-6">
              Monitor sentiment. Spot issues. Act faster.
            </h1>
            <p className="text-xl text-[#010D3E] tracking-tight mt-6">
              Score single reviews or analyze datasets to analyse and predict sentiment distribution. Powered by an NLP + ML pipeline and served via a Flask API.
            </p>
            <div className="flex gap-1 items-center mt-[30px]">
              <button className="btn btn-primary" onClick={() => scrollToId("demo")}>
                Demo
              </button>
              <button
                className="btn btn-text gap-1"
                onClick={() =>
                  window.open(
                    "https://github.com/SyedAliRazaGilani/NLP-and-ML-Sentiment-Analysis-Prediction",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                <span>Learn more</span>
                <ArrowIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-20 md:mt-0 md:h-[648px] md:flex-1 relative">
            <motion.img
              src={cogImage.src}
              alt="Cog image"
              className="md:absolute md:h-full md:w-auto md:max-w-none md:-left-6 lg:left-0"
              animate={{
                translateY: [-30, 30],
              }}
              transition={{
                repeat: Infinity,
                repeatType: "mirror",
                duration: 3,
                ease: "easeInOut",
              }}
            />
            <motion.img
              src={cylinderImage.src}
              width={220}
              height={220}
              alt="Cylinder image"
              className="hidden md:block -top-8 -left-32 md:absolute"
              style={{
                translateY: translateY,
              }}
            />
            <motion.img
              src={noodleImage.src}
              width={220}
              alt="Noodle image"
              className="hidden lg:block absolute top-[524px] left-[448px] rotate-[30deg]"
              style={{
                rotate: 30,
                translateY: translateY,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
