"use client";

import { useEffect, useState } from "react";
import { isMarketOpen, getNextMarketEvent } from "@/lib/market";
import { cn } from "@/lib/utils";

interface MarketStatusBadgeProps {
    className?: string;
}

/**
 * Shows a live "Market Open" (green pulse) or "Market Closed" (grey) badge
 * with a countdown to the next market open or close event.
 * Updates every second via setInterval.
 */
export function MarketStatusBadge({ className }: MarketStatusBadgeProps) {
    const [open, setOpen] = useState(false);
    const [eventLabel, setEventLabel] = useState("");

    useEffect(() => {
        function tick() {
            setOpen(isMarketOpen());
            setEventLabel(getNextMarketEvent().label);
        }

        tick(); // run immediately on mount
        const id = setInterval(tick, 1_000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className={cn("flex flex-col items-end gap-0.5", className)}>
            {/* Status row */}
            <div className="flex items-center gap-1.5">
                {/* Dot */}
                <span className="relative flex h-2 w-2">
                    {open ? (
                        <>
                            {/* Pulsing outer ring */}
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                        </>
                    ) : (
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-gray-500" />
                    )}
                </span>

                {/* Label */}
                <span
                    className={cn(
                        "text-xs font-medium",
                        open ? "text-green-400" : "text-gray-400",
                    )}
                >
                    {open ? "Market Open" : "Market Closed"}
                </span>
            </div>

            {/* Countdown */}
            <span className="text-[10px] text-gray-500 tabular-nums">
                {eventLabel}
            </span>
        </div>
    );
}
