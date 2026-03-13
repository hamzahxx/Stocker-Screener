"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { StockResult } from "@/lib/api";
import { getMetric } from "@/lib/metrics";
import { GradeBadge } from "@/components/GradeBadge";
import { Tooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/utils";

// ─── Sort types ───────────────────────────────────────────────────────────────

export type SortKey =
    | "final_score"
    | "rsi"
    | "macd"
    | "adx"
    | "uptrend"
    | "sma"
    | "volume"
    | "near_support"
    | null;

export type SortDir = "asc" | "desc" | null;

interface ScreenerTableProps {
    data: StockResult[];
    sortKey: SortKey;
    sortDir: SortDir;
    /** Called with the column's sort key when a header is clicked. */
    onSort: (key: SortKey) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDetail<T>(
    stock: StockResult,
    indicator: string,
    field: string,
): T | undefined {
    return stock.checks?.[indicator]?.details?.[field] as T | undefined;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** ✅ / ❌ boolean indicator */
function BoolIcon({ value }: { value: boolean | undefined }) {
    if (value === undefined || value === null)
        return <span className="text-gray-600">—</span>;
    return value ? (
        <span className="text-green-400" title="Yes">
            ✓
        </span>
    ) : (
        <span className="text-red-400" title="No">
            ✗
        </span>
    );
}

/** SMA signal badge: BUY / NEUTRAL / SELL */
function SmaBadge({ signal }: { signal: string | undefined }) {
    if (!signal) return <span className="text-gray-600">—</span>;
    const styles =
        signal === "BUY"
            ? "bg-green-400/10 text-green-400 border-green-400/25"
            : signal === "SELL"
              ? "bg-red-400/10 text-red-400 border-red-400/25"
              : "bg-amber-400/10 text-amber-400 border-amber-400/25";
    return (
        <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${styles}`}
        >
            {signal}
        </span>
    );
}

/** Volume label badge */
function VolumeBadge({ label }: { label: string | undefined }) {
    if (!label) return <span className="text-gray-600">—</span>;
    const styles =
        label === "HIGH_VOLUME_BREAKOUT"
            ? "bg-green-400/10 text-green-400 border-green-400/25"
            : label === "NORMAL_VOLUME_UP"
              ? "bg-lime-400/10 text-lime-400 border-lime-400/25"
              : label === "LOW_VOLUME_UP"
                ? "bg-amber-400/10 text-amber-400 border-amber-400/25"
                : "bg-red-400/10 text-red-400 border-red-400/25";
    // Shorten for table density
    const short =
        label === "HIGH_VOLUME_BREAKOUT"
            ? "HIGH"
            : label === "NORMAL_VOLUME_UP"
              ? "NORMAL"
              : label === "LOW_VOLUME_UP"
                ? "LOW"
                : "SELL";
    return (
        <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${styles}`}
        >
            {short}
        </span>
    );
}

/** RSI label coloured text */
function RsiLabel({ label }: { label: string | undefined }) {
    if (!label) return <span className="text-gray-600">—</span>;
    const color =
        label === "EARLY_RECOVERY"
            ? "text-green-400"
            : label === "OVERSOLD_BASE"
              ? "text-lime-400"
              : label === "DEEPLY_OVERSOLD"
                ? "text-amber-400"
                : label === "NEUTRAL"
                  ? "text-gray-400"
                  : label === "EXTENDED"
                    ? "text-amber-400"
                    : label === "OVERBOUGHT"
                      ? "text-red-400"
                      : "text-gray-400";
    return (
        <span className={`text-[10px] font-semibold ${color}`}>{label}</span>
    );
}

/** Inline score bar + number  */
function ScoreCell({ score }: { score: number }) {
    const pct = Math.max(0, Math.min(100, score));
    const color =
        pct >= 85
            ? "bg-emerald-400"
            : pct >= 70
              ? "bg-green-400"
              : pct >= 60
                ? "bg-lime-400"
                : pct >= 50
                  ? "bg-amber-400"
                  : "bg-red-400";
    const textColor =
        pct >= 85
            ? "text-emerald-400"
            : pct >= 70
              ? "text-green-400"
              : pct >= 60
                ? "text-lime-400"
                : pct >= 50
                  ? "text-amber-400"
                  : "text-red-400";
    return (
        <div className="flex min-w-[72px] flex-col gap-0.5">
            <span
                className={`font-mono text-xs font-semibold tabular-nums ${textColor}`}
            >
                {pct.toFixed(1)}
            </span>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#2a2a2e]">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ─── Column definitions ───────────────────────────────────────────────────────

interface ColDef {
    label: string;
    tooltip: string;
    sortKey: SortKey;
    align: "left" | "right" | "center";
}

const SCORE_TOOLTIP =
    "The overall swing trade score (0–100) calculated as the weighted sum of all 10 scored indicators. Higher is better.";
const GRADE_TOOLTIP =
    "Letter grade derived from the final score: A+ (≥85), A (≥70), B (≥60), C (≥50), D (<50).";

const PRICE_TOOLTIP =
    "Current market price in INR (₹), sourced from the same daily data feed used for scoring.";

const COLUMNS: ColDef[] = [
    // non-indicator columns
    {
        label: "Score",
        tooltip: SCORE_TOOLTIP,
        sortKey: "final_score",
        align: "left",
    },
    { label: "Grade", tooltip: GRADE_TOOLTIP, sortKey: null, align: "center" },
    {
        label: "Price (₹)",
        tooltip: PRICE_TOOLTIP,
        sortKey: null,
        align: "right",
    },
    // indicator columns — tooltips from METRIC_LABELS
    {
        label: "RSI",
        tooltip: getMetric("rsi")?.tooltip ?? "",
        sortKey: "rsi",
        align: "right",
    },
    {
        label: "RSI Signal",
        tooltip: getMetric("rsi")?.tooltip ?? "",
        sortKey: null,
        align: "center",
    },
    {
        label: "MACD Hist",
        tooltip: getMetric("macd")?.tooltip ?? "",
        sortKey: "macd",
        align: "right",
    },
    {
        label: "ADX",
        tooltip: getMetric("adx")?.tooltip ?? "",
        sortKey: "adx",
        align: "right",
    },
    {
        label: "Trend",
        tooltip: getMetric("uptrend")?.tooltip ?? "",
        sortKey: "uptrend",
        align: "center",
    },
    {
        label: "SMA",
        tooltip: getMetric("sma")?.tooltip ?? "",
        sortKey: "sma",
        align: "center",
    },
    {
        label: "Volume",
        tooltip: getMetric("volume")?.tooltip ?? "",
        sortKey: "volume",
        align: "center",
    },
    {
        label: "Support",
        tooltip: getMetric("near_support")?.tooltip ?? "",
        sortKey: "near_support",
        align: "center",
    },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function ScreenerTable({
    data,
    sortKey,
    sortDir,
    onSort,
}: ScreenerTableProps) {
    const router = useRouter();

    function sortIcon(col: ColDef): React.ReactNode {
        if (col.sortKey === null) return null;
        if (col.sortKey !== sortKey)
            return <span className="ml-1 text-gray-700">↕</span>;
        return (
            <span className="ml-1 text-[#60a5fa]">
                {sortDir === "asc" ? "↑" : "↓"}
            </span>
        );
    }

    // ── Empty state ────────────────────────────────────────────────────────────
    if (data.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded-lg border border-[#2a2a2e] bg-[#141416]">
                <p className="text-sm text-gray-500">
                    No stocks match the current filters.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-[#2a2a2e]">
            <table className="w-full min-w-[900px] border-collapse text-xs">
                {/* ── Header ────────────────────────────────────────────────────── */}
                <thead>
                    <tr className="border-b border-[#2a2a2e] bg-[#141416]">
                        {/* Rank + Ticker always visible */}
                        <th className="px-3 py-2.5 text-left font-medium text-gray-500">
                            #
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-500">
                            Ticker
                        </th>

                        {COLUMNS.map((col) => (
                            <th
                                key={col.label}
                                className={`px-3 py-2.5 font-medium text-gray-500 ${
                                    col.align === "right"
                                        ? "text-right"
                                        : col.align === "center"
                                          ? "text-center"
                                          : "text-left"
                                }`}
                            >
                                <Tooltip content={col.tooltip}>
                                    <button
                                        onClick={() =>
                                            col.sortKey !== null &&
                                            onSort(col.sortKey)
                                        }
                                        className={`inline-flex items-center gap-0 whitespace-nowrap ${
                                            col.sortKey
                                                ? "cursor-pointer hover:text-gray-200"
                                                : "cursor-default"
                                        }`}
                                    >
                                        {col.label}
                                        {sortIcon(col)}
                                    </button>
                                </Tooltip>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* ── Body ──────────────────────────────────────────────────────── */}
                <tbody>
                    {data.map((stock, idx) => {
                        // ── Error row ────────────────────────────────────────────────
                        if (stock.error) {
                            return (
                                <tr
                                    key={stock.ticker}
                                    className="border-b border-[#2a2a2e] last:border-0 bg-[#0d0d0f]/40"
                                >
                                    <td className="px-3 py-2 font-mono text-gray-700">
                                        {idx + 1}
                                    </td>
                                    <td className="px-3 py-2 font-mono font-semibold text-gray-600">
                                        {stock.ticker}
                                    </td>
                                    <td
                                        colSpan={COLUMNS.length}
                                        className="px-3 py-2 text-gray-600"
                                    >
                                        <span className="mr-1.5 text-red-500/60">
                                            ⚠
                                        </span>
                                        {stock.error}
                                    </td>
                                </tr>
                            );
                        }

                        // ── Normal row ───────────────────────────────────────────────
                        const currentPrice = getDetail<number>(
                            stock,
                            "52w_high",
                            "current_price",
                        );
                        const rsi = getDetail<number>(stock, "rsi", "rsi");
                        const rsiLabel = getDetail<string>(
                            stock,
                            "rsi",
                            "rsi_label",
                        );
                        const histogram = getDetail<number>(
                            stock,
                            "macd",
                            "histogram",
                        );
                        const adx = getDetail<number>(stock, "adx", "adx");
                        const uptrend = getDetail<boolean>(
                            stock,
                            "uptrend",
                            "uptrend",
                        );
                        const smaSignal = getDetail<string>(
                            stock,
                            "sma",
                            "sma_signal",
                        );
                        const volumeLabel = getDetail<string>(
                            stock,
                            "volume",
                            "volume_label",
                        );
                        const nearSupport = getDetail<boolean>(
                            stock,
                            "near_support",
                            "near_support",
                        );

                        const histPositive =
                            typeof histogram === "number" && histogram > 0;

                        return (
                            <tr
                                key={stock.ticker}
                                onClick={() =>
                                    router.push(
                                        `/equity/${encodeURIComponent(stock.ticker)}`,
                                    )
                                }
                                className="cursor-pointer border-b border-[#2a2a2e] last:border-0 transition-colors hover:bg-[#141416]"
                            >
                                {/* Rank */}
                                <td className="px-3 py-2 font-mono text-gray-500">
                                    {idx + 1}
                                </td>

                                {/* Ticker */}
                                <td className="px-3 py-2 font-mono font-semibold text-gray-100">
                                    {stock.ticker}
                                </td>

                                {/* Final Score */}
                                <td className="px-3 py-2">
                                    <ScoreCell score={stock.final_score} />
                                </td>

                                {/* Grade */}
                                <td className="px-3 py-2 text-center">
                                    <GradeBadge grade={stock.grade} />
                                </td>

                                {/* Price */}
                                <td className="px-3 py-2 text-right font-mono tabular-nums text-gray-200">
                                    {currentPrice !== undefined
                                        ? `₹${currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
                                        : "—"}
                                </td>

                                {/* RSI */}
                                <td className="px-3 py-2 text-right font-mono tabular-nums text-gray-200">
                                    {fmt(rsi, 1)}
                                </td>

                                {/* RSI Label */}
                                <td className="px-3 py-2 text-center">
                                    <RsiLabel label={rsiLabel} />
                                </td>

                                {/* MACD Histogram */}
                                <td
                                    className={`px-3 py-2 text-right font-mono tabular-nums ${
                                        histPositive
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >
                                    {fmt(histogram, 4)}
                                </td>

                                {/* ADX */}
                                <td className="px-3 py-2 text-right font-mono tabular-nums text-gray-200">
                                    {fmt(adx, 1)}
                                </td>

                                {/* Trend */}
                                <td className="px-3 py-2 text-center">
                                    <BoolIcon value={uptrend} />
                                </td>

                                {/* SMA Signal */}
                                <td className="px-3 py-2 text-center">
                                    <SmaBadge signal={smaSignal} />
                                </td>

                                {/* Volume */}
                                <td className="px-3 py-2 text-center">
                                    <VolumeBadge label={volumeLabel} />
                                </td>

                                {/* Near Support */}
                                <td className="px-3 py-2 text-center">
                                    <BoolIcon value={nearSupport} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
