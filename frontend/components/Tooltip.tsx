"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import { type ReactNode } from "react";

interface TooltipProps {
    /** The plain-text explanation shown in the popover. */
    content: string;
    children: ReactNode;
    /** Delay before the tooltip appears in milliseconds (default 200). */
    delayMs?: number;
}

/**
 * Accessible hover tooltip wrapping Radix UI.
 * Wrap any element with <Tooltip content="..."> to add a dark popover on hover.
 */
export function Tooltip({ content, children, delayMs = 200 }: TooltipProps) {
    return (
        <RadixTooltip.Provider delayDuration={delayMs}>
            <RadixTooltip.Root>
                <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                    <RadixTooltip.Content
                        side="top"
                        align="center"
                        sideOffset={6}
                        className={[
                            "z-50 max-w-xs rounded-md border border-[#2a2a2e]",
                            "bg-[#1e1e22] px-3 py-2 text-xs leading-relaxed text-gray-100",
                            "shadow-lg shadow-black/40",
                            "animate-in fade-in-0 zoom-in-95",
                            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
                        ].join(" ")}
                    >
                        {content}
                        <RadixTooltip.Arrow className="fill-[#2a2a2e]" />
                    </RadixTooltip.Content>
                </RadixTooltip.Portal>
            </RadixTooltip.Root>
        </RadixTooltip.Provider>
    );
}
