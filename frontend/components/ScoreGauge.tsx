"use client";

import React from "react";
import { GradeBadge } from "@/components/GradeBadge";

interface ScoreGaugeProps {
  score: number;
  grade: string | null | undefined;
  className?: string;
}

// SVG arc constants
const R = 54;
const CX = 60;
const CY = 60;
const C = 2 * Math.PI * R;          // total circumference ≈ 339.29
const ARC = (270 / 360) * C;        // 270° visible arc ≈ 254.47
const GAP = C - ARC;                 // 90° gap at the bottom ≈ 84.82

// Rotate so the arc starts at lower-left (7:30 o'clock) and grows clockwise
// through the top to lower-right (4:30 o'clock)
const ROTATION = 135;

/** SVG stroke colour derived from score bucket (mirrors scoreColor in utils.ts). */
function arcColor(score: number): string {
  if (score >= 85) return "#4ade80"; // emerald-400
  if (score >= 70) return "#22c55e"; // green-400
  if (score >= 60) return "#a3e635"; // lime-400
  if (score >= 50) return "#fbbf24"; // amber-400
  return "#f87171";                   // red-400
}

/**
 * Circular arc gauge displaying a final score (0–100) with a colour-coded SVG
 * ring and a `GradeBadge` below the dial.
 */
export function ScoreGauge({ score, grade, className }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score ?? 0));
  const fillLen = (clamped / 100) * ARC;
  const color = arcColor(clamped);

  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`}>
      {/* SVG dial */}
      <div className="relative inline-flex items-center justify-center">
        <svg
          width="160"
          height="160"
          viewBox="0 0 120 120"
          role="img"
          aria-label={`Score: ${clamped.toFixed(1)} out of 100`}
        >
          {/* Background track (grey) */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#2a2a2e"
            strokeWidth="8"
            strokeDasharray={`${ARC} ${GAP}`}
            strokeLinecap="round"
            transform={`rotate(${ROTATION}, ${CX}, ${CY})`}
          />

          {/* Score fill arc */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${fillLen} ${C - fillLen}`}
            strokeLinecap="round"
            transform={`rotate(${ROTATION}, ${CX}, ${CY})`}
            style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease" }}
          />
        </svg>

        {/* Centred number overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold font-mono tabular-nums leading-none"
            style={{ color }}
          >
            {clamped.toFixed(1)}
          </span>
          <span className="mt-1 font-mono text-[11px] text-gray-500">/ 100</span>
        </div>
      </div>

      {/* Grade pill below dial */}
      <GradeBadge grade={grade} />
    </div>
  );
}
