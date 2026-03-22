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
            className={cn("animate-pulse rounded bg-border", className)}
            style={style}
        />
    );
}

/** Skeleton for the index screener table — renders placeholder rows */
function TableSkeleton({ count }: { count: number }) {
    return (
        <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-225 border-collapse text-xs">
                {/* Header */}
                <thead>
                    <tr className="border-b border-border bg-surface">
                        <th className="px-3 py-2.5 text-left">
                            <SkeletonBlock className="h-3 w-3" />
                        </th>
                        <th className="px-3 py-2.5 text-left">
                            <SkeletonBlock className="h-3 w-12" />
                        </th>
                        <th className="px-3 py-2.5 text-left">
                            <SkeletonBlock className="h-3 w-10" />
                        </th>
                        <th className="px-3 py-2.5 text-center">
                            <SkeletonBlock className="mx-auto h-3 w-10" />
                        </th>
                        <th className="px-3 py-2.5 text-right">
                            <SkeletonBlock className="ml-auto h-3 w-14" />
                        </th>
                        <th className="px-3 py-2.5 text-right">
                            <SkeletonBlock className="ml-auto h-3 w-8" />
                        </th>
                        <th className="px-3 py-2.5 text-center">
                            <SkeletonBlock className="mx-auto h-3 w-12" />
                        </th>
                        <th className="px-3 py-2.5 text-right">
                            <SkeletonBlock className="ml-auto h-3 w-12" />
                        </th>
                        <th className="px-3 py-2.5 text-right">
                            <SkeletonBlock className="ml-auto h-3 w-8" />
                        </th>
                        <th className="px-3 py-2.5 text-center">
                            <SkeletonBlock className="mx-auto h-3 w-8" />
                        </th>
                        <th className="px-3 py-2.5 text-center">
                            <SkeletonBlock className="mx-auto h-3 w-8" />
                        </th>
                        <th className="px-3 py-2.5 text-center">
                            <SkeletonBlock className="mx-auto h-3 w-10" />
                        </th>
                        <th className="px-3 py-2.5 text-center">
                            <SkeletonBlock className="mx-auto h-3 w-11" />
                        </th>
                    </tr>
                </thead>

                {/* Rows */}
                <tbody>
                    {Array.from({ length: count }).map((_, rowIdx) => (
                        <tr
                            key={rowIdx}
                            className="border-b border-border last:border-0"
                        >
                            <td className="px-3 py-2">
                                <SkeletonBlock className="h-3 w-4" />
                            </td>
                            <td className="px-3 py-2">
                                <SkeletonBlock className="h-3 w-14" />
                            </td>
                            <td className="px-3 py-2">
                                <div className="flex min-w-18 flex-col gap-0.5">
                                    <SkeletonBlock className="h-3 w-8" />
                                    <SkeletonBlock className="h-0.75 w-full rounded-full" />
                                </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                                <SkeletonBlock className="mx-auto h-5 w-10 rounded-full" />
                            </td>
                            <td className="px-3 py-2 text-right">
                                <SkeletonBlock className="ml-auto h-3 w-14" />
                            </td>
                            <td className="px-3 py-2 text-right">
                                <SkeletonBlock className="ml-auto h-3 w-8" />
                            </td>
                            <td className="px-3 py-2 text-center">
                                <SkeletonBlock className="mx-auto h-3 w-14" />
                            </td>
                            <td className="px-3 py-2 text-right">
                                <SkeletonBlock className="ml-auto h-3 w-12" />
                            </td>
                            <td className="px-3 py-2 text-right">
                                <SkeletonBlock className="ml-auto h-3 w-8" />
                            </td>
                            <td className="px-3 py-2 text-center">
                                <SkeletonBlock className="mx-auto h-3 w-3" />
                            </td>
                            <td className="px-3 py-2 text-center">
                                <SkeletonBlock className="mx-auto h-5 w-12 rounded-full" />
                            </td>
                            <td className="px-3 py-2 text-center">
                                <SkeletonBlock className="mx-auto h-5 w-14 rounded-full" />
                            </td>
                            <td className="px-3 py-2 text-center">
                                <SkeletonBlock className="mx-auto h-3 w-3" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
                    className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <SkeletonBlock className="h-3 w-24" />
                            <SkeletonBlock className="h-3 w-3 rounded-full" />
                        </div>
                        <SkeletonBlock className="h-5 w-16 rounded-full" />
                    </div>

                    {/* Score row */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1">
                            <SkeletonBlock className="h-6 w-10" />
                            <SkeletonBlock className="h-3 w-8" />
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                            <SkeletonBlock className="h-3 w-12" />
                            <SkeletonBlock className="h-2.5 w-14" />
                        </div>
                    </div>

                    {/* Progress bar */}
                    <SkeletonBlock className="h-0.75 w-full rounded-full" />

                    {/* Detail rows */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <SkeletonBlock className="h-2.5 w-16" />
                        <SkeletonBlock className="ml-auto h-2.5 w-14" />
                        <SkeletonBlock className="h-2.5 w-20" />
                        <SkeletonBlock className="ml-auto h-2.5 w-12" />
                        <SkeletonBlock className="h-2.5 w-14" />
                        <SkeletonBlock className="ml-auto h-2.5 w-16" />
                    </div>
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
