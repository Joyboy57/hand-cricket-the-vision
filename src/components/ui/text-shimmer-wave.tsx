
"use client";

import React, { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export type TextShimmerProps = {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  duration?: number;
  spread?: number;
  zDistance?: number;
};

export function TextShimmerWave({
  children,
  className,
  textClassName,
  duration = 2,
  spread = 2,
  zDistance = 10,
}: TextShimmerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 200 };
  const springProgress = useSpring(progress, springConfig);

  // Dynamically create the gradient stops
  const baseColor = "var(--base-color, currentColor)";
  const gradientColor = "var(--base-gradient-color, white)";

  useEffect(() => {
    const timer = window.setInterval(() => {
      progress.set(Math.random());
    }, duration * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [duration, progress]);

  return (
    <div
      ref={ref}
      className={cn(
        "isolate flex items-center justify-center overflow-hidden",
        className
      )}
    >
      <motion.div
        className={cn("relative", textClassName)}
        style={{
          color: baseColor,
        }}
      >
        {children}
        <motion.span
          className="absolute inset-0 whitespace-nowrap overflow-hidden"
          style={{
            color: gradientColor,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            WebkitMaskImage: `linear-gradient(
              to right,
              transparent,
              black ${spread * 15}%,
              black ${100 - spread * 15}%,
              transparent
            )`,
            transform: useTransform(
              springProgress,
              [0, 1],
              ["translateX(-35%)", "translateX(135%)"]
            ),
          }}
        >
          {children}
        </motion.span>
      </motion.div>
    </div>
  );
}
