"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

type TooltipProps = {
    content: string;
    children: ReactNode;
    className?: string;
    "data-testid"?: string;
};

/**
 * Wraps `children` with a CSS-only tooltip that shows `content` on hover.
 * Positioned relative to the wrapper, so `children` should visually
 * represent (e.g. truncated) the same text as `content`.
 */
function Tooltip({ content, children, className, ...rest }: TooltipProps) {
    return (
        <div className={clsx("group relative", className)}>
            {children}
            <div
                role="tooltip"
                data-testid={rest["data-testid"]}
                className={clsx(
                    "pointer-events-none invisible absolute left-0 right-0 top-full z-20 mt-1",
                    "break-words rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg",
                    "opacity-0 transition-opacity duration-150",
                    "group-hover:visible group-hover:opacity-100",
                )}
            >
                {content}
            </div>
        </div>
    );
}

export default Tooltip;
