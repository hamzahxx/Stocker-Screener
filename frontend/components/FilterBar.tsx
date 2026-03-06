"use client";

import React from "react";
import * as Slider from "@radix-ui/react-slider";

export interface FilterState {
    minScore: number;
    grades: string[]; // empty array = show all grades
    smaSignals: string[]; // empty array = show all SMA signals
    uptrendOnly: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
    minScore: 0,
    grades: [],
    smaSignals: [],
    uptrendOnly: false,
};

interface FilterBarProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
}

const GRADES = ["A+", "A", "B", "C", "D"] as const;
const SMA_SIGNALS = ["BUY", "NEUTRAL", "SELL"] as const;

/** Toggle an item in/out of an array. */
function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

const GRADE_ACTIVE: Record<string, string> = {
    "A+": "bg-emerald-400/20 text-emerald-400 border-emerald-400/40",
    A: "bg-green-400/20 text-green-400 border-green-400/40",
    B: "bg-lime-400/20 text-lime-400 border-lime-400/40",
    C: "bg-amber-400/20 text-amber-400 border-amber-400/40",
    D: "bg-red-400/20 text-red-400 border-red-400/40",
};

const SMA_ACTIVE: Record<string, string> = {
    BUY: "bg-green-400/20 text-green-400 border-green-400/40",
    NEUTRAL: "bg-amber-400/20 text-amber-400 border-amber-400/40",
    SELL: "bg-red-400/20 text-red-400 border-red-400/40",
};

const INACTIVE =
    "bg-transparent text-gray-500 border-[#2a2a2e] hover:border-gray-500 hover:text-gray-300 transition-colors";

export function FilterBar({ filters, onChange }: FilterBarProps) {
    const anyActive =
        filters.minScore > 0 ||
        filters.grades.length > 0 ||
        filters.smaSignals.length > 0 ||
        filters.uptrendOnly;

    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-[#2a2a2e] bg-[#141416] px-4 py-2.5 text-sm">
            {/* ── Min Score slider ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <span className="whitespace-nowrap text-xs text-gray-400">
                    Min Score
                </span>

                <Slider.Root
                    min={0}
                    max={100}
                    step={5}
                    value={[filters.minScore]}
                    onValueChange={([v]) =>
                        onChange({ ...filters, minScore: v })
                    }
                    className="relative flex h-5 w-32 touch-none select-none items-center"
                >
                    <Slider.Track className="relative h-[3px] w-full grow rounded-full bg-[#2a2a2e]">
                        <Slider.Range className="absolute h-full rounded-full bg-[#60a5fa]" />
                    </Slider.Track>
                    <Slider.Thumb
                        className="block h-4 w-4 cursor-grab rounded-full border-2 border-[#60a5fa] bg-[#141416] active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/40"
                        aria-label="Minimum final score"
                    />
                </Slider.Root>

                <span className="w-7 text-right font-mono text-xs tabular-nums text-gray-200">
                    {filters.minScore}
                </span>
            </div>

            <div className="hidden h-4 w-px bg-[#2a2a2e] sm:block" />

            {/* ── Grade pills ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs text-gray-400">
                    Grade
                </span>
                <div className="flex gap-1">
                    {GRADES.map((g) => (
                        <button
                            key={g}
                            onClick={() =>
                                onChange({
                                    ...filters,
                                    grades: toggle(filters.grades, g),
                                })
                            }
                            className={`rounded border px-2 py-0.5 text-[11px] font-semibold font-mono ${
                                filters.grades.includes(g)
                                    ? GRADE_ACTIVE[g]
                                    : INACTIVE
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            <div className="hidden h-4 w-px bg-[#2a2a2e] sm:block" />

            {/* ── SMA Signal pills ────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xs text-gray-400">
                    SMA
                </span>
                <div className="flex gap-1">
                    {SMA_SIGNALS.map((s) => (
                        <button
                            key={s}
                            onClick={() =>
                                onChange({
                                    ...filters,
                                    smaSignals: toggle(filters.smaSignals, s),
                                })
                            }
                            className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                                filters.smaSignals.includes(s)
                                    ? SMA_ACTIVE[s]
                                    : INACTIVE
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="hidden h-4 w-px bg-[#2a2a2e] sm:block" />

            {/* ── Uptrend Only toggle ─────────────────────────────────────────── */}
            <label className="flex cursor-pointer items-center gap-2 select-none">
                <input
                    type="checkbox"
                    checked={filters.uptrendOnly}
                    onChange={(e) =>
                        onChange({ ...filters, uptrendOnly: e.target.checked })
                    }
                    className="h-3.5 w-3.5 cursor-pointer rounded border-[#2a2a2e] bg-[#0d0d0f] accent-[#60a5fa]"
                />
                <span className="whitespace-nowrap text-xs text-gray-400">
                    Uptrend Only
                </span>
            </label>

            {/* ── Reset link (only when something is active) ──────────────────── */}
            {anyActive && (
                <button
                    onClick={() => onChange(DEFAULT_FILTERS)}
                    className="ml-auto text-[11px] text-gray-600 hover:text-gray-300 transition-colors"
                >
                    Reset
                </button>
            )}
        </div>
    );
}
