"use client";

import { useMemo } from "react";
import cn from "classnames";
import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";

type PaginationProps = {
    currentPage: number;
    totalCount: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    className?: string;
    siblingCount?: number; // Number of page siblings on each side
};

type PageItem = {
    type: "page" | "ellipsis" | "previous" | "next";
    value: number | null;
    label: string;
    isActive?: boolean;
    isDisabled?: boolean;
};

const usePagination = ({
    currentPage,
    totalPages,
    siblingCount = 1,
}: {
    currentPage: number;
    totalPages: number;
    siblingCount?: number;
}) => {
    const paginationRange = useMemo(() => {
        const totalPageNumbers = siblingCount + 5; // Start, End, Current, 2 siblings

        // Case 1: If the number of pages is less than the page numbers we want to show
        if (totalPageNumbers >= totalPages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        // Case 2: No left dots to show, but rights dots to be shown
        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
            return [...leftRange, "...", totalPages];
        }

        // Case 3: No right dots to show, but left dots to be shown
        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            const rightRange = Array.from(
                { length: rightItemCount },
                (_, i) => totalPages - rightItemCount + i + 1
            );
            return [firstPageIndex, "...", ...rightRange];
        }

        // Case 4: Both left and right dots to be shown
        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = Array.from(
                { length: rightSiblingIndex - leftSiblingIndex + 1 },
                (_, i) => leftSiblingIndex + i
            );
            return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
        }

        return [];
    }, [currentPage, totalPages, siblingCount]);

    return paginationRange;
};

const Pagination = ({
    currentPage,
    totalCount,
    itemsPerPage,
    onPageChange,
    isLoading = false,
    className,
    siblingCount = 1,
}: PaginationProps) => {
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const paginationRange = usePagination({ currentPage, totalPages, siblingCount });

    // Don't render pagination if there's only one page or no pages
    if (totalPages <= 1) {
        return null;
    }

    const handlePageChange = (page: number) => {
        if (page !== currentPage && !isLoading) {
            onPageChange(page);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    const items: PageItem[] = [];

    // Previous button
    items.push({
        type: "previous",
        value: currentPage - 1,
        label: "Anterior",
        isDisabled: currentPage <= 1 || isLoading,
    });

    // Page numbers and ellipsis
    paginationRange.forEach((pageNumber, index) => {
        if (pageNumber === "...") {
            items.push({
                type: "ellipsis",
                value: null,
                label: "...",
            });
        } else {
            items.push({
                type: "page",
                value: pageNumber as number,
                label: String(pageNumber),
                isActive: pageNumber === currentPage,
                isDisabled: isLoading,
            });
        }
    });

    // Next button
    items.push({
        type: "next",
        value: currentPage + 1,
        label: "Próximo",
        isDisabled: currentPage >= totalPages || isLoading,
    });

    return (
        <nav
            role="navigation"
            aria-label="Pagination Navigation"
            className={cn("flex items-center justify-center", className)}
        >
            <div className="flex items-center space-x-1 sm:space-x-2">
                {items.map((item, index) => {
                    if (item.type === "ellipsis") {
                        return (
                            <Typography
                                key={`ellipsis-${index}`}
                                element="span"
                                variant="secondary"
                                size="sm"
                                className="px-2 py-1"
                                aria-hidden="true"
                            >
                                {item.label}
                            </Typography>
                        );
                    }

                    if (item.type === "previous") {
                        return (
                            <Button
                                key="previous"
                                variant="secondary"
                                disabled={item.isDisabled}
                                onClick={handlePrevious}
                                className={cn("hidden sm:flex px-3 py-2 text-sm", {
                                    "cursor-not-allowed opacity-50": item.isDisabled,
                                })}
                                aria-label="Go to previous page"
                            >
                                <span className="sr-only">Página anterior, </span>
                                {item.label}
                            </Button>
                        );
                    }

                    if (item.type === "next") {
                        return (
                            <Button
                                key="next"
                                variant="secondary"
                                disabled={item.isDisabled}
                                onClick={handleNext}
                                className={cn("hidden sm:flex px-3 py-2 text-sm", {
                                    "cursor-not-allowed opacity-50": item.isDisabled,
                                })}
                                aria-label="Go to next page"
                            >
                                <span className="sr-only">Next page, </span>
                                {item.label}
                            </Button>
                        );
                    }

                    // Page number button
                    return (
                        <Button
                            key={`page-${item.value}`}
                            variant={item.isActive ? "primary" : "secondary"}
                            disabled={item.isDisabled}
                            onClick={() => item.value && handlePageChange(item.value)}
                            className={cn("min-w-[2.5rem] h-10 px-2 py-2 text-sm font-medium", {
                                "cursor-not-allowed opacity-50": item.isDisabled,
                                "bg-primary text-white border-primary": item.isActive,
                                "hover:bg-quaternary": !item.isActive && !item.isDisabled,
                            })}
                            aria-label={
                                item.isActive
                                    ? `Current page, page ${item.value}`
                                    : `Go to page ${item.value}`
                            }
                            aria-current={item.isActive ? "page" : undefined}
                        >
                            {item.label}
                        </Button>
                    );
                })}
            </div>

            {/* Mobile navigation arrows */}
            <div className="flex sm:hidden items-center space-x-4 ml-4">
                <Button
                    variant="secondary"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={handlePrevious}
                    className={cn("p-2 rounded-full", {
                        "cursor-not-allowed opacity-50": currentPage <= 1 || isLoading,
                    })}
                    aria-label="Go to previous page"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </Button>

                <Typography
                    element="span"
                    variant="secondary"
                    size="sm"
                    className="text-center min-w-[4rem]"
                    aria-live="polite"
                >
                    {currentPage} of {totalPages}
                </Typography>

                <Button
                    variant="secondary"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={handleNext}
                    className={cn("p-2 rounded-full", {
                        "cursor-not-allowed opacity-50": currentPage >= totalPages || isLoading,
                    })}
                    aria-label="Go to next page"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </Button>
            </div>
        </nav>
    );
};

export default Pagination;
