"use client";

import { motion } from "framer-motion";
import React, { useEffect, useId, useMemo, useState } from "react";

type MaybeRef<T extends HTMLElement> = React.RefObject<T | null>;

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  duration = 3,
  delay = 0,
  gradientStartColor = "#111111",
  gradientStopColor = "#111111",
  className,
}: {
  containerRef: MaybeRef<HTMLDivElement>;
  fromRef: MaybeRef<HTMLElement>;
  toRef: MaybeRef<HTMLElement>;
  curvature?: number;
  duration?: number;
  delay?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  className?: string;
}) {
  const gid = useId();
  const [pathD, setPathD] = useState<string | null>(null);
  const [pathLen, setPathLen] = useState<number>(300);

  const compute = () => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;

    const c = container.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();

    const x1 = a.left + a.width / 2 - c.left;
    const y1 = a.top + a.height / 2 - c.top;
    const x2 = b.left + b.width / 2 - c.left;
    const y2 = b.top + b.height / 2 - c.top;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const cp1x = mx;
    const cp1y = my + curvature;

    const d = `M ${x1} ${y1} Q ${cp1x} ${cp1y} ${x2} ${y2}`;
    setPathD(d);

    const approx = Math.hypot(x2 - x1, y2 - y1) * 1.25;
    setPathLen(Math.max(120, Math.min(1200, approx)));
  };

  useEffect(() => {
    compute();
    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    const interval = window.setInterval(compute, 600);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dashArray = useMemo(() => `${Math.max(40, pathLen * 0.2)} ${pathLen}`, [pathLen]);

  if (!pathD) return null;

  return (
    <svg className={className} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`beam-${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor={gradientStartColor} />
          <stop offset="1" stopColor={gradientStopColor} />
        </linearGradient>
      </defs>

      <path d={pathD} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      <motion.path
        d={pathD}
        fill="none"
        stroke={`url(#beam-${gid})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={dashArray}
        initial={{ strokeDashoffset: pathLen }}
        animate={{ strokeDashoffset: 0 }}
        transition={{
          duration,
          delay,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
    </svg>
  );
}

