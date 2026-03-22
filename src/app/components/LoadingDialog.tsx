"use client";

import { useState, useEffect, useRef } from "react";

const STATUS_MESSAGES = [
  "Anonymizing transcript...",
  "Removing personal identifiers...",
  "Analyzing health determinants...",
  "Classifying social factors...",
  "Building encounter record...",
];

const CYCLE_MS = 1000;
const TICK_MS = 50;

export default function LoadingDialog({ isOpen }: { isOpen: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const targetRef = useRef(0);

  // Cycle status messages every CYCLE_MS and bump the target progress
  useEffect(() => {
    if (!isOpen) {
      setMessageIndex(0);
      setProgress(0);
      targetRef.current = 0;
      return;
    }

    // Set initial target
    targetRef.current = 15;

    const id = setInterval(() => {
      setMessageIndex((i) => {
        const next = (i + 1) % STATUS_MESSAGES.length;
        // Each message maps to a progress milestone (15 → 35 → 55 → 75 → 90)
        const targets = [15, 35, 55, 75, 90];
        targetRef.current = targets[next];
        return next;
      });
    }, CYCLE_MS);

    return () => clearInterval(id);
  }, [isOpen]);

  // Smoothly animate progress toward target
  useEffect(() => {
    if (!isOpen) return;

    const id = setInterval(() => {
      setProgress((prev) => {
        const target = targetRef.current;
        if (prev >= target) return prev;
        const step = Math.max(0.5, (target - prev) * 0.15);
        return Math.min(prev + step, target);
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(7, 19, 40, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div
        className="glass-strong"
        style={{
          padding: "48px 44px",
          maxWidth: 420,
          width: "90%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Pulsing icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--teal), var(--teal-dark))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            animation: "pulseGlow 2s ease-in-out infinite",
            boxShadow: "0 0 30px rgba(0, 201, 167, 0.4)",
          }}
        >
          🧠
        </div>

        {/* Status message */}
        <div style={{ minHeight: 28 }}>
          <p
            key={messageIndex}
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--white)",
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            {STATUS_MESSAGES[messageIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: 6,
            borderRadius: 3,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: 3,
              background:
                "linear-gradient(90deg, var(--teal), var(--teal-light), var(--teal))",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
              transition: "width 0.2s ease-out",
            }}
          />
        </div>

        {/* Percentage */}
        <p
          style={{
            fontSize: 13,
            color: "var(--gray-400)",
            marginTop: -16,
            fontFamily: "var(--font-mono)",
          }}
        >
          {Math.round(progress)}%
        </p>

        {/* Subtext */}
        <p
          style={{
            fontSize: 13,
            color: "var(--gray-400)",
            marginTop: -16,
          }}
        >
          This may take a moment
        </p>
      </div>
    </div>
  );
}
