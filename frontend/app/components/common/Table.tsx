"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";

type ColumnDefinition<T> = {
    header: string;
    cell: (row: T) => React.ReactNode;
    width?: string;
    multiLine?: boolean;
};

type TableProps<T> = {
    data: T[];
    columns: ColumnDefinition<T>[];
    keyExtractor: (row: T) => string | number;
    rowClassName?: (row: T) => string | undefined;
};

const Table = <T extends {}>({ data, columns, keyExtractor, rowClassName }: TableProps<T>) => {
    const hasCustomWidths = columns.some((column) => column.width);
    const [scrollState, setScrollState] = useState({
        isScrollable: false,
        canScrollLeft: false,
        canScrollRight: false,
        scrollLeft: 0,
        scrollWidth: 0,
        clientWidth: 0,
    });
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateScrollState = () => {
            if (scrollContainerRef.current) {
                const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current;
                const isScrollable = scrollWidth > clientWidth;
                const canScrollLeft = scrollLeft > 0;
                const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1; // -1 for rounding

                setScrollState({
                    isScrollable,
                    canScrollLeft,
                    canScrollRight,
                    scrollLeft,
                    scrollWidth,
                    clientWidth,
                });
            }
        };

        updateScrollState();

        window.addEventListener("resize", updateScrollState);

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", updateScrollState);
            return () => {
                window.removeEventListener("resize", updateScrollState);
                scrollContainer.removeEventListener("scroll", updateScrollState);
            };
        }

        return () => window.removeEventListener("resize", updateScrollState);
    }, [data, columns]);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            const { clientWidth, scrollLeft } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.8; // Scroll 80% of viewport width
            scrollContainerRef.current.scrollTo({
                left: Math.max(0, scrollLeft - scrollAmount),
                behavior: "smooth",
            });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            const { clientWidth, scrollLeft, scrollWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.8; // Scroll 80% of viewport width
            const maxScroll = scrollWidth - clientWidth;
            scrollContainerRef.current.scrollTo({
                left: Math.min(maxScroll, scrollLeft + scrollAmount),
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="relative">
            <div ref={scrollContainerRef} className="overflow-x-auto">
                <table
                    className={clsx("min-w-full", hasCustomWidths ? "table-fixed" : "table-auto")}
                >
                    <thead>
                        <tr className="bg-gray-50">
                            {columns.map((column) => (
                                <th
                                    key={column.header}
                                    className={clsx(
                                        "px-4 py-3 text-left text-sm font-bold text-gray-700",
                                        column.width && "truncate"
                                    )}
                                    style={column.width ? { width: column.width } : undefined}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr
                                key={keyExtractor(row)}
                                className={clsx(
                                    "hover:bg-light transition-colors duration-150",
                                    rowClassName && rowClassName(row)
                                )}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.header}
                                        className={clsx(
                                            "px-4 py-3 text-sm text-gray-900",
                                            column.width && !column.multiLine && "truncate",
                                            column.multiLine && "whitespace-pre-wrap break-words"
                                        )}
                                        style={column.width ? { width: column.width } : undefined}
                                    >
                                        {column.cell(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Scroll Indicators */}
            {scrollState.isScrollable && (
                <>
                    {/* Right side indicators - show when can scroll right */}
                    {scrollState.canScrollRight && (
                        <>
                            {/* Right gradient fade effect */}
                            <div
                                className={clsx(
                                    "absolute top-0 right-0 bottom-0 w-8",
                                    "bg-gradient-to-l from-white via-white/80 to-transparent",
                                    "pointer-events-none z-10"
                                )}
                            />

                            {/* Right arrow indicator */}
                            <div
                                className={clsx(
                                    "absolute top-1/2 right-2 transform -translate-y-1/2 z-20",
                                    "cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                )}
                                onClick={scrollRight}
                            >
                                <div
                                    className={clsx(
                                        "bg-primary text-white rounded-full p-1 shadow-md",
                                        "hover:bg-secondary"
                                    )}
                                >
                                    <CaretRightIcon size={16} weight="bold" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Left side indicators - show when can scroll left */}
                    {scrollState.canScrollLeft && (
                        <>
                            {/* Left gradient fade effect */}
                            <div
                                className={clsx(
                                    "absolute top-0 left-0 bottom-0 w-8",
                                    "bg-gradient-to-r from-white via-white/80 to-transparent",
                                    "pointer-events-none z-10"
                                )}
                            />

                            {/* Left arrow indicator */}
                            <div
                                className={clsx(
                                    "absolute top-1/2 left-2 transform -translate-y-1/2 z-20",
                                    "cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                )}
                                onClick={scrollLeft}
                            >
                                <div
                                    className={clsx(
                                        "bg-primary text-white rounded-full p-1 shadow-md",
                                        "hover:bg-secondary"
                                    )}
                                >
                                    <CaretLeftIcon size={16} weight="bold" />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Table;
