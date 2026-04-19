"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { IPagination } from "@/types";

interface PaginationProps {
  pagination?: IPagination;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (!pagination) return null;

  const { page, totalPages, hasNext, hasPrev } = pagination;
  console.log(pagination);

  if (totalPages <= 1) return null;

  const maxVisiblePages = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const btnBase =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-9 w-9";
  const btnGhost = "hover:bg-accent hover:text-accent-foreground";
  const btnActive = "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground";
  const btnDisabled = "opacity-50 cursor-not-allowed";

  return (
    <nav role="navigation" aria-label="pagination" className="mx-auto flex w-full justify-center">
      <ul className="flex flex-row items-center gap-1">
        {/* Previous */}
        <li>
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => onPageChange(page - 1)}
            className={cn(
              btnBase,
              "gap-1 px-2.5 w-auto",
              hasPrev ? btnGhost + " cursor-pointer" : btnDisabled
            )}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:block">Previous</span>
          </button>
        </li>

        {/* First page + ellipsis */}
        {startPage > 1 && (
          <>
            <li>
              <button
                type="button"
                onClick={() => onPageChange(1)}
                className={cn(btnBase, btnGhost, "cursor-pointer")}
              >
                1
              </button>
            </li>
            {startPage > 2 && (
              <li>
                <span className="inline-flex items-center justify-center h-9 w-9">
                  <MoreHorizontal className="size-4" />
                </span>
              </li>
            )}
          </>
        )}

        {/* Page numbers */}
        {pages.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(btnBase, p === page ? btnActive : btnGhost, "cursor-pointer")}
            >
              {p}
            </button>
          </li>
        ))}

        {/* Last page + ellipsis */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <li>
                <span className="inline-flex items-center justify-center h-9 w-9">
                  <MoreHorizontal className="size-4" />
                </span>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                className={cn(btnBase, btnGhost, "cursor-pointer")}
              >
                {totalPages}
              </button>
            </li>
          </>
        )}

        {/* Next */}
        <li>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
            className={cn(
              btnBase,
              "gap-1 px-2.5 w-auto",
              hasNext ? btnGhost + " cursor-pointer" : btnDisabled
            )}
            aria-label="Go to next page"
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRight className="size-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
