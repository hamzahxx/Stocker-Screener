"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchEquity, ApiError } from "@/lib/api";
import { METRIC_LABELS } from "@/lib/metrics";
import { MetricCard } from "@/components/MetricCard";
import { ScoreGauge } from "@/components/ScoreGauge";
import { GradeBadge } from "@/components/GradeBadge";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ error }: { error: unknown }) {
    const msg =
        (error as ApiError)?.status === 401
            ? "Invalid API Key — check NEXT_PUBLIC_API_KEY."
            : `Error ${(error as ApiError)?.status ?? ""}: ${
                  (error as ApiError)?.message ?? "Unknown error"
              }`;
    return (
        <div className="rounded-md border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {msg}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EquityDetailPage() {
    const { ticker } = useParams<{ ticker: string }>();
    const router = useRouter();
    const upperTicker = ticker?.toUpperCase() ?? "";

    const {
        data,
        isLoading,
        isError,
        error,
        dataUpdatedAt,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ["equity", upperTicker],
        queryFn: () => fetchEquity(upperTicker),
        enabled: !!upperTicker,
        staleTime: 60_000,
        retry: 1,
        // No automatic polling — scores are derived from daily candles.
    });

    const lastUpdated = dataUpdatedAt
        ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
          })
        : null;

    return (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* ── Back link ─────────────────────────────────────────── */}
            <button
                onClick={() => router.push("/")}
                className="mb-6 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
                <span>←</span>
                <span>Back to Screener</span>
            </button>

            {/* ── Loading ───────────────────────────────────────────── */}
            {isLoading && (
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="h-8 w-32 rounded bg-[#2a2a2e] animate-pulse" />
                        <div className="h-40 w-40 rounded-full bg-[#2a2a2e] animate-pulse" />
                    </div>
                    <LoadingSkeleton variant="cards" />
                </div>
            )}

            {/* ── Error ─────────────────────────────────────────────── */}
            {isError && !isLoading && (
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold text-gray-100">
                        {upperTicker}
                    </h1>
                    <ErrorBanner error={error} />
                    <button
                        onClick={() => refetch()}
                        className="rounded border border-[#2a2a2e] bg-[#141416] px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ── Data ──────────────────────────────────────────────── */}
            {data && !isLoading && (
                <div className="space-y-6">
                    {/* Header ─────────────────────────────────────── */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-gray-50">
                                    {data.ticker}
                                </h1>
                                <GradeBadge grade={data.grade} />
                            </div>
                            {/* Current price */}
                            {(() => {
                                const price = data.checks?.["52w_high"]?.details?.current_price as number | undefined;
                                return price !== undefined ? (
                                    <p className="mt-1 font-mono text-2xl font-semibold text-gray-100 tabular-nums">
                                        ₹{price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                    </p>
                                ) : null;
                            })()}
                            {lastUpdated && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Last updated: {lastUpdated}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex items-center gap-1.5 rounded border border-[#2a2a2e] bg-[#141416] px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFetching ? (
                                <>
                                    <span className="inline-block h-3 w-3 animate-spin rounded-full border border-gray-500 border-t-blue-400" />
                                    Refreshing…
                                </>
                            ) : (
                                "↺ Refresh"
                            )}
                        </button>
                    </div>

                    {/* Gauge ───────────────────────────────────────── */}
                    <div className="flex justify-center py-4">
                        <ScoreGauge
                            score={data.final_score}
                            grade={data.grade}
                        />
                    </div>

                    {/* Error stock banner ─────────────────────────── */}
                    {data.error && (
                        <div className="rounded-md border border-amber-500/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
                            ⚠ Scoring incomplete: {data.error}
                        </div>
                    )}

                    {/* Metric cards ───────────────────────────────── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {METRIC_LABELS.map((meta) => {
                            const detail = data.checks?.[meta.key];
                            if (!detail) return null;
                            return (
                                <MetricCard
                                    key={meta.key}
                                    metricKey={meta.key}
                                    meta={meta}
                                    detail={detail}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </main>
    );
}
