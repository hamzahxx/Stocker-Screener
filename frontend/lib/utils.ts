import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (handles conflicts). */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/** Tailwind text-colour class for a grade string. */
export function gradeColor(grade: string | null | undefined): string {
    switch (grade) {
        case "A+":
            return "text-emerald-400";
        case "A":
            return "text-green-400";
        case "B":
            return "text-lime-400";
        case "C":
            return "text-amber-400";
        case "D":
            return "text-red-400";
        default:
            return "text-gray-400";
    }
}

/** Tailwind text-colour class based on a 0–100 score. */
export function scoreColor(score: number): string {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-green-400";
    if (score >= 60) return "text-lime-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
}

/** Tailwind background-colour class based on a 0–100 score. */
export function scoreBgColor(score: number): string {
    if (score >= 85) return "bg-emerald-400";
    if (score >= 70) return "bg-green-400";
    if (score >= 60) return "bg-lime-400";
    if (score >= 50) return "bg-amber-400";
    return "bg-red-400";
}

/**
 * Format a number for display.
 * @param n     The number to format (undefined/null → fallback).
 * @param dp    Decimal places (default 2).
 * @param fallback String shown when value is missing (default "—").
 */
export function fmt(
    n: number | undefined | null,
    dp = 2,
    fallback = "—",
): string {
    if (n === undefined || n === null || isNaN(n)) return fallback;
    return n.toFixed(dp);
}

/**
 * Encode an NSE index display name to the URL path segment the API expects.
 * e.g. "NIFTY 50" → "NIFTY%2050"
 */
export function encodeIndex(name: string): string {
    return name.replace(/ /g, "%20");
}

/**
 * Derive a Bullish / Neutral / Bearish status label from pct_of_max (0–100).
 */
export function statusLabel(pctOfMax: number | undefined): string {
    if (pctOfMax === undefined || pctOfMax === null) return "N/A";
    if (pctOfMax >= 70) return "Bullish";
    if (pctOfMax >= 40) return "Neutral";
    return "Bearish";
}

/** Tailwind text-colour class for Bullish / Neutral / Bearish / N/A. */
export function statusColor(status: string): string {
    switch (status) {
        case "Bullish":
            return "text-green-400";
        case "Neutral":
            return "text-amber-400";
        case "Bearish":
            return "text-red-400";
        default:
            return "text-gray-500";
    }
}
