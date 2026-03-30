"use client";
import starImage from "@/assets/star.png";
import springImage from "@/assets/spring.png";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";

export const CallToAction = () => {
  const sectionRef = useRef(null);
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  const submit = async () => {
    const v = email.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!ok) {
      setError("Please enter a valid email address.");
      return;
    }
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) {
      setError("Email sending is not configured. Missing EmailJS env variables.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_email: v,
          subject: "New signup from Sentiment Demo",
          message: `New signup: ${v}`,
          page_url: typeof window !== "undefined" ? window.location.href : "",
        },
        { publicKey }
      );
      setShowSuccess(true);
      setEmail("");
    } catch (e: any) {
      setError(e?.text || e?.message || "Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="bg-gradient-to-b from-white to-[#D2DCFF] py-24 overflow-x-clip"
    >
      <div className="container">
        <div className="section-heading relative">
          <h2 className="section-title">Sign up for free today</h2>
          <p className="section-description mt-5">
            Celebrate the joy of accomplishment with an app designed to track
            your progress and motivate your efforts.
          </p>
          <motion.img
            src={starImage.src}
            alt="Star Image"
            width={360}
            className="absolute -left-[350px] -top-[137px]"
            style={{
              translateY,
            }}
          />
          <motion.img
            src={springImage.src}
            alt="Spring Image"
            width={360}
            className="absolute -right-[331px] -top-[19px]"
            style={{
              translateY,
            }}
          />
        </div>
        <div className="mt-10 flex justify-center">
          <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white/80 backdrop-blur p-4 shadow-[0_7px_14px_#EAEAEA]">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Enter your email"
                className="h-12 w-full sm:w-[420px] rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-black/20"
              />
              <button className="h-12 w-full sm:w-40 rounded-2xl bg-black text-white text-sm font-medium tracking-tight" onClick={submit}>
                {loading ? "Sending…" : "Sign up"}
              </button>
            </div>
            {error ? <p className="mt-2 text-center text-xs text-red-600">{error}</p> : null}
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="text-lg font-bold">Success</div>
            <p className="mt-2 text-sm text-black/70">
              You’re signed up. We’ll reach out soon.
            </p>
            <button className="btn btn-primary w-full mt-6" onClick={() => setShowSuccess(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
