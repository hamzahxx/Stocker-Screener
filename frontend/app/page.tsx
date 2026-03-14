"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchIndexScreener, StockResult, ApiError } from "@/lib/api";
import { encodeIndex } from "@/lib/utils";
import { NavBar } from "@/components/NavBar";
import {
    FilterBar,
    FilterState,
    DEFAULT_FILTERS,
} from "@/components/FilterBar";
import { ScreenerTable, SortKey, SortDir } from "@/components/ScreenerTable";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

// Default index on first load
const DEFAULT_INDEX = encodeIndex("NIFTY 50");

// ─── Filtering ────────────────────────────────────────────────────────────────

function applyFilters(
    data: StockResult[],
    filters: FilterState,
): StockResult[] {
    return data.filter((s) => {
        if (s.error) return true; // always show errored rows so user can see

        if (s.final_score < filters.minScore) return false;

        if (
            filters.grades.length > 0 &&
            !filters.grades.includes(s.grade ?? "")
        )
            return false;

        if (filters.smaSignals.length > 0) {
            const smaSignal = s.checks?.sma?.details?.sma_signal as
                | string
                | undefined;
            if (!smaSignal || !filters.smaSignals.includes(smaSignal))
                return false;
        }

        if (filters.uptrendOnly) {
            const uptrend = s.checks?.uptrend?.details?.uptrend as
                | boolean
                | undefined;
            if (!uptrend) return false;
        }

        return true;
    });
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

function getValue(stock: StockResult, key: SortKey): number {
    if (!key) return 0;
    if (stock.error) return -Infinity;
    switch (key) {
        case "final_score":
            return stock.final_score ?? 0;
        case "rsi":
            return (stock.checks?.rsi?.details?.rsi as number) ?? 0;
        case "macd":
            return (stock.checks?.macd?.details?.histogram as number) ?? 0;
        case "adx":
            return (stock.checks?.adx?.details?.adx as number) ?? 0;
        case "uptrend":
            return (stock.checks?.uptrend?.details?.uptrend as boolean) ? 1 : 0;
        case "sma": {
            const sig = stock.checks?.sma?.details?.sma_signal as
                | string
                | undefined;
            return sig === "BUY" ? 2 : sig === "NEUTRAL" ? 1 : 0;
        }
        case "volume": {
            const lbl = stock.checks?.volume?.details?.volume_label as
                | string
                | undefined;
            return lbl === "ACCUMULATION_BREAKOUT"
                ? 5
                : lbl === "ACCUMULATION"
                  ? 4
                  : lbl === "HIGH_VOLUME_UP"
                    ? 3
                    : lbl === "NORMAL_UP"
                      ? 2
                      : lbl === "QUIET"
                        ? 1
                        : 0; // DISTRIBUTION
        }
        case "near_support":
            return (stock.checks?.near_support?.details
                ?.near_support as boolean)
                ? 1
                : 0;
        default:
            return 0;
    }
}

function applySort(
    data: StockResult[],
    key: SortKey,
    dir: SortDir,
): StockResult[] {
    if (!key || !dir) return data;
    return [...data].sort((a, b) => {
        const diff = getValue(a, key) - getValue(b, key);
        return dir === "asc" ? diff : -diff;
    });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
    const [selectedIndex, setSelectedIndex] = useState(DEFAULT_INDEX);
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [sortKey, setSortKey] = useState<SortKey>("final_score");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const queryClient = useQueryClient();

    const { data, isLoading, isError, error, isFetching, refetch } = useQuery<
        StockResult[],
        ApiError
    >({
        queryKey: ["screener", selectedIndex],
        queryFn: () => fetchIndexScreener(selectedIndex),
        staleTime: 60_000,
        // No automatic polling — data is based on daily candles and won't
        // change within a session. We refetch on tab focus via visibilitychange.
    });

    // ── Page Visibility: pause polling when tab is hidden ─────────────────────
    const handleVisibility = useCallback(() => {
        if (document.hidden) {
            queryClient.cancelQueries({
                queryKey: ["screener", selectedIndex],
            });
        } else {
            // Re-trigger when tab becomes visible again
            queryClient.invalidateQueries({
                queryKey: ["screener", selectedIndex],
            });
        }
    }, [queryClient, selectedIndex]);

    useEffect(() => {
        document.addEventListener("visibilitychange", handleVisibility);
        return () =>
            document.removeEventListener("visibilitychange", handleVisibility);
    }, [handleVisibility]);

    // ── Sort cycling: asc → desc → null(default desc) ────────────────────────
    function handleSort(key: SortKey) {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("desc");
        } else if (sortDir === "desc") {
            setSortDir("asc");
        } else {
            setSortKey("final_score");
            setSortDir("desc");
        }
    }

    // ── Derive display data ───────────────────────────────────────────────────
    const filtered = applyFilters(data ?? [], filters);
    const sorted = applySort(filtered, sortKey, sortDir);

    // ── Error banner ──────────────────────────────────────────────────────────
    const apiErr = error as ApiError | null;
    const errorBanner = isError ? (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {apiErr?.status === 401 ? (
                <>
                    <strong>Invalid API Key</strong> — check your{" "}
                    <code className="font-mono text-red-300">.env.local</code>{" "}
                    file.
                </>
            ) : (
                <>
                    <strong>Error {apiErr?.status ?? ""}:</strong>{" "}
                    {apiErr?.message ?? "Failed to fetch data."}
                </>
            )}
        </div>
    ) : null;

    return (
        <div className="min-h-screen bg-[#0d0d0f] text-gray-100">
            {/* Top nav — NavBar owns the index selector so it can display the current selection */}
            <NavBar
                selectedIndex={selectedIndex}
                onIndexSelect={setSelectedIndex}
                onRefresh={refetch}
                isRefreshing={isFetching}
            />

            <main className="mx-auto max-w-screen-xl px-4 py-6">
                {/* Page title + result count */}
                <div className="mb-4 flex items-baseline gap-3">
                    <h1 className="text-lg font-semibold text-gray-100">
                        Index Screener
                    </h1>
                    {!isLoading && data && (
                        <span className="font-mono text-xs text-gray-500">
                            {sorted.length} / {data.length} stocks
                        </span>
                    )}
                </div>

                {errorBanner}

                {/* Filter bar */}
                <div className="mb-4">
                    <FilterBar filters={filters} onChange={setFilters} />
                </div>

                {/* Table / skeleton */}
                {isLoading ? (
                    <LoadingSkeleton variant="rows" />
                ) : (
                    <ScreenerTable
                        data={sorted}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={handleSort}
                    />
                )}
            </main>
        </div>
    );
}
