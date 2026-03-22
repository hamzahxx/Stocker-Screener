"use client";

import React from "react";
import { IndicatorDetail } from "@/lib/api";
import { MetricMeta } from "@/lib/metrics";
import { Tooltip } from "@/components/Tooltip";
import { fmt, statusLabel, statusColor } from "@/lib/utils";

interface MetricCardProps {
    metricKey: string;
    meta: MetricMeta;
    detail: IndicatorDetail;
}

// ─── Per-indicator key detail rows ───────────────────────────────────────────

/** Returns an array of { label, value } rows to show in the card body. */
function getDetailRows(
    key: string,
    details: Record<string, unknown>,
): { label: string; value: string }[] {
    const n = (field: string, dp = 2) =>
        fmt(details[field] as number | undefined, dp);
    const b = (field: string) => {
        const v = details[field];
        if (v === undefined || v === null) return "—";
        return v ? "Yes" : "No";
    };
    const s = (field: string) => String(details[field] ?? "—");

    switch (key) {
        case "rsi":
            return [
                { label: "RSI", value: n("rsi", 1) },
                { label: "Signal", value: s("rsi_label") },
            ];
        case "macd":
            return [
                { label: "MACD", value: n("macd", 4) },
                { label: "Signal", value: n("signal", 4) },
                { label: "Histogram", value: n("histogram", 4) },
                { label: "Label", value: s("macd_label") },
            ];
        case "adx":
            return [
                { label: "ADX", value: n("adx", 1) },
                { label: "+DI", value: n("plus_di", 1) },
                { label: "-DI", value: n("minus_di", 1) },
                { label: "Label", value: s("adx_label") },
            ];
        case "volume":
            return [
                { label: "Volume Ratio", value: n("volume_ratio", 2) + "×" },
                { label: "Signal", value: s("volume_label") },
            ];
        case "fibonacci":
            return [
                { label: "Retrace %", value: `${n("fib_retrace_pct", 1)}%` },
                { label: "Zone", value: s("label") },
            ];
        case "support_resistance":
            return [
                { label: "Supports", value: s("support_count") },
                { label: "Resistances", value: s("resistance_count") },
                { label: "Nearest Support", value: n("nearest_support", 2) },
                { label: "Nearest Resistance", value: n("nearest_resistance", 2) },
            ];
        case "near_support":
            return [{ label: "Near Support", value: b("near_support") }];
        case "uptrend":
            return [{ label: "Above SMA200", value: b("uptrend") }];
        case "52w_high":
            return [
                { label: "52W High", value: n("52w_high", 2) },
                { label: "Current", value: n("current_price", 2) },
                {
                    label: "% from High",
                    value: `${n("pct_from_52w_high", 1)}%`,
                },
                { label: "Breakout", value: b("fresh_breakout") },
                { label: "Label", value: s("label") },
            ];
        case "sma":
            return [{ label: "Signal", value: s("sma_signal") }];
        case "bullish_intent":
            return [
                { label: "Big Green Candle", value: b("big_green") },
                { label: "Engulfing", value: b("engulfing") },
            ];
        default:
            return [];
    }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ pctOfMax }: { pctOfMax: number | undefined }) {
    const label = statusLabel(pctOfMax);
    const colorClass = statusColor(label);
    const bgClass =
        label === "Bullish"
            ? "bg-green-400/10 border-green-400/25"
            : label === "Bearish"
              ? "bg-red-400/10 border-red-400/25"
              : label === "Neutral"
                ? "bg-amber-400/10 border-amber-400/25"
                : "bg-gray-700/30 border-gray-600/25";

    return (
        <span
            className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${colorClass} ${bgClass}`}
        >
            {label}
        </span>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MetricCard({ metricKey, meta, detail }: MetricCardProps) {
    const rows = getDetailRows(metricKey, detail.details ?? {});

    // % of max bar fill
    const pct = detail.pct_of_max ?? 0;
    const barColor =
        pct >= 70 ? "bg-green-400" : pct >= 40 ? "bg-amber-400" : "bg-red-400";

    return (
        <div
            className={[
                "flex flex-col gap-3 rounded-lg border p-4",
                meta.informational
                    ? "border-[#2a2a2e] bg-[#141416]/60 opacity-80"
                    : "border-[#2a2a2e] bg-[#141416]",
            ].join(" ")}
        >
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Tooltip content={meta.tooltip}>
                        <button className="flex items-center gap-1.5 text-left group">
                            <span className="text-xs font-semibold text-gray-200 leading-snug group-hover:text-white transition-colors">
                                {meta.label}
                            </span>
                            <span className="shrink-0 text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">
                                ⓘ
                            </span>
                        </button>
                    </Tooltip>
                </div>

                {meta.informational ? (
                    <span className="shrink-0 rounded border border-gray-700/50 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
                        INFO
                    </span>
                ) : (
                    <StatusBadge pctOfMax={detail.pct_of_max} />
                )}
            </div>

            {/* ── Score row ─────────────────────────────────────────── */}
            {!meta.informational && (
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1">
                        <span className="font-mono text-lg font-bold text-gray-100 tabular-nums leading-none">
                            {detail.score ?? "—"}
                        </span>
                        <span className="font-mono text-xs text-gray-500">
                            / {meta.maxRawScore}
                        </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-xs text-gray-400 tabular-nums">
                            +{fmt(detail.weighted_score, 1)} pts
                        </span>
                        <span className="font-mono text-[10px] text-gray-600 tabular-nums">
                            {fmt(detail.pct_of_max, 0)}% of max
                        </span>
                    </div>
                </div>
            )}

            {/* ── % of max progress bar ─────────────────────────────── */}
            {!meta.informational && (
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#2a2a2e]">
                    <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                    />
                </div>
            )}

            {/* ── Key detail rows ───────────────────────────────────── */}
            {rows.length > 0 && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {rows.map(({ label, value }) => (
                        <React.Fragment key={label}>
                            <span className="text-[10px] text-gray-500 truncate">
                                {label}
                            </span>
                            <span className="text-[10px] font-mono text-gray-300 truncate text-right">
                                {value}
                            </span>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}
