"use client";

import { encodeIndex } from "@/lib/utils";

/** All 11 NIFTY indices listed in the PRD (display name → API slug via encodeIndex). */
const NIFTY_INDICES = [
  "NIFTY 50",
  "NIFTY 100",
  "NIFTY 200",
  "NIFTY NEXT 50",
  "NIFTY MIDCAP 50",
  "NIFTY MIDCAP 100",
  "NIFTY MIDCAP 150",
  "NIFTY SMALLCAP 50",
  "NIFTY SMALLCAP 100",
  "NIFTY SMALLCAP 250",
  "NIFTY BANK",
  "NIFTY AUTO",
  "NIFTY PHARMA",
  "NIFTY FMCG",
] as const;

interface IndexSelectorProps {
  /** Currently selected encoded slug, e.g. "NIFTY%2050" */
  value: string;
  /** Called with the encoded slug when the user picks a new index */
  onSelect: (slug: string) => void;
  className?: string;
}

/**
 * Dropdown listing all 11 NIFTY indices.
 * The `value` and `onSelect` payload use the URL-encoded slug (spaces → %20),
 * matching the format expected by `fetchIndexScreener()` and the FastAPI backend.
 */
export function IndexSelector({ value, onSelect, className = "" }: IndexSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onSelect(e.target.value)}
      aria-label="Select NIFTY Index"
      className={[
        "cursor-pointer appearance-none rounded-md",
        "border border-[#2a2a2e] bg-[#141416]",
        "px-3 py-1.5 pr-8 text-sm text-gray-200",
        "focus:outline-none focus:ring-1 focus:ring-[#60a5fa] focus:border-[#60a5fa]",
        "min-w-[180px]",
        className,
      ].join(" ")}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {NIFTY_INDICES.map((name) => {
        const slug = encodeIndex(name);
        return (
          <option key={name} value={slug} className="bg-[#141416] text-gray-200">
            {name}
          </option>
        );
      })}
    </select>
  );
}
