import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    variant: "rows" | "cards";
    /** Number of skeleton rows/cards to render (default: rows=10, cards=11) */
    count?: number;
    className?: string;
}

function SkeletonBlock({
    className,
    style,
}: {
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={cn("animate-pulse rounded bg-[#2a2a2e]", className)}
            style={style}
        />
    );
}

/** Skeleton for the index screener table — renders placeholder rows */
function TableSkeleton({ count }: { count: number }) {
    return (
        <div className="w-full overflow-hidden rounded-lg border border-[#2a2a2e]">
            {/* Header */}
            <div className="flex gap-3 border-b border-[#2a2a2e] bg-[#141416] px-4 py-3">
                {[40, 80, 70, 50, 55, 55, 65, 55, 50, 60, 60, 50].map(
                    (w, i) => (
                        <SkeletonBlock
                            key={i}
                            className={`h-3`}
                            style={{ width: w }}
                        />
                    ),
                )}
            </div>

            {/* Rows */}
            {Array.from({ length: count }).map((_, rowIdx) => (
                <div
                    key={rowIdx}
                    className="flex items-center gap-3 border-b border-[#2a2a2e] px-4 py-2.5 last:border-0"
                >
                    <SkeletonBlock className="h-3 w-6" />
                    <SkeletonBlock className="h-3 w-20" />
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-5 w-10 rounded-full" />
                    <SkeletonBlock className="h-3 w-12" />
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-3 w-14" />
                    <SkeletonBlock className="h-3 w-12" />
                    <SkeletonBlock className="h-3 w-6" />
                    <SkeletonBlock className="h-5 w-14 rounded-full" />
                    <SkeletonBlock className="h-5 w-16 rounded-full" />
                    <SkeletonBlock className="h-3 w-6" />
                </div>
            ))}
        </div>
    );
}

/** Skeleton for the stock detail metric grid — renders placeholder cards */
function CardsSkeleton({ count }: { count: number }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-[#2a2a2e] bg-[#141416] p-4 space-y-3"
                >
                    {/* Label row */}
                    <div className="flex items-center justify-between">
                        <SkeletonBlock className="h-3 w-32" />
                        <SkeletonBlock className="h-5 w-16 rounded-full" />
                    </div>
                    {/* Score row */}
                    <div className="flex items-baseline gap-2">
                        <SkeletonBlock className="h-6 w-10" />
                        <SkeletonBlock className="h-3 w-8" />
                    </div>
                    {/* Progress bar */}
                    <SkeletonBlock className="h-1.5 w-full rounded-full" />
                    {/* Detail rows */}
                    <SkeletonBlock className="h-3 w-24" />
                    <SkeletonBlock className="h-3 w-20" />
                </div>
            ))}
        </div>
    );
}

/**
 * Animated loading placeholder.
 * - variant="rows"  → table skeleton (for the index screener)
 * - variant="cards" → metric card grid skeleton (for the stock detail page)
 */
export function LoadingSkeleton({
    variant,
    count,
    className,
}: LoadingSkeletonProps) {
    const defaultCount = variant === "rows" ? 10 : 11;
    const n = count ?? defaultCount;

    return (
        <div className={cn("w-full", className)}>
            {variant === "rows" ? (
                <TableSkeleton count={n} />
            ) : (
                <CardsSkeleton count={n} />
            )}
        </div>
    );
}
