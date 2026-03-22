"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IndexSelector } from "@/components/IndexSelector";
import { MarketStatusBadge } from "@/components/MarketStatusBadge";

interface NavBarProps {
    /** Encoded index slug currently selected, e.g. "NIFTY%2050" */
    selectedIndex: string;
    /** Called with the new encoded slug when the user picks a different index */
    onIndexSelect: (slug: string) => void;
    /** Called when the Refresh button is clicked */
    onRefresh?: () => void;
    /** Whether a refresh is currently in flight */
    isRefreshing?: boolean;
}

/**
 * Sticky top navigation bar.
 *
 * Layout:
 *  [Left]  App name / logo
 *  [Centre] IndexSelector dropdown
 *  [Right]  MarketStatusBadge + ticker search input
 *
 * The search input navigates to `/equity/[TICKER]` on Enter.
 */
export function NavBar({
    selectedIndex,
    onIndexSelect,
    onRefresh,
    isRefreshing,
}: NavBarProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");

    function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            const ticker = search.trim().toUpperCase();
            if (ticker) {
                router.push(`/equity/${encodeURIComponent(ticker)}`);
                setSearch("");
            }
        }
    }

    return (
        <header className="sticky top-0 z-50 border-b border-[#2a2a2e] bg-[#0d0d0f]/90 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4">
                {/* Left — app name */}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="whitespace-nowrap text-base font-bold tracking-tight text-white">
                        Stocker, The NSE Screener
                    </span>
                </div>

                {/* Centre — index selector */}
                <div className="flex flex-1 items-center justify-center">
                    <IndexSelector
                        value={selectedIndex}
                        onSelect={onIndexSelect}
                    />
                </div>

                {/* Right — market badge + search */}
                <div className="flex flex-1 items-center justify-end gap-4">
                    <MarketStatusBadge />

                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            title="Refresh data"
                            className="flex items-center gap-1 rounded border border-[#2a2a2e] bg-[#141416] px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span
                                className={
                                    isRefreshing
                                        ? "inline-block animate-spin"
                                        : undefined
                                }
                            >
                                &#x21BB;
                            </span>
                        </button>
                    )}

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value.toUpperCase())
                        }
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search ticker…"
                        aria-label="Search for a stock ticker"
                        className={[
                            "w-36 rounded-md border border-[#2a2a2e] bg-[#141416]",
                            "px-3 py-1.5 font-mono text-sm text-gray-200",
                            "placeholder:text-gray-600",
                            "focus:border-[#60a5fa] focus:outline-none focus:ring-1 focus:ring-[#60a5fa]",
                        ].join(" ")}
                    />
                </div>
            </div>
        </header>
    );
}
