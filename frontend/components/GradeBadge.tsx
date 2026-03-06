"use client";

import { cn } from "@/lib/utils";

interface GradeBadgeProps {
  grade: string | null | undefined;
  className?: string;
}

const GRADE_STYLES: Record<string, string> = {
  "A+": "bg-emerald-400/15 text-emerald-400 ring-emerald-400/30",
  "A":  "bg-green-400/15  text-green-400  ring-green-400/30",
  "B":  "bg-lime-400/15   text-lime-400   ring-lime-400/30",
  "C":  "bg-amber-400/15  text-amber-400  ring-amber-400/30",
  "D":  "bg-red-400/15    text-red-400    ring-red-400/30",
};

const DEFAULT_STYLE = "bg-gray-700/40 text-gray-400 ring-gray-600/30";

/**
 * Colour-coded pill badge for stock grades (A+, A, B, C, D).
 */
export function GradeBadge({ grade, className }: GradeBadgeProps) {
  const style = grade ? (GRADE_STYLES[grade] ?? DEFAULT_STYLE) : DEFAULT_STYLE;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-semibold font-mono ring-1 ring-inset",
        style,
        className
      )}
    >
      {grade ?? "—"}
    </span>
  );
}
