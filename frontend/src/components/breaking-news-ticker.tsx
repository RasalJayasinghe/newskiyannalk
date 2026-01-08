"use client";

import * as React from "react";
import { NewsItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BreakingNewsTickerProps {
  breakingNews: NewsItem[];
  className?: string;
}

export function BreakingNewsTicker({ breakingNews, className }: BreakingNewsTickerProps) {
  if (breakingNews.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-black text-white py-2 border-b-2 border-white z-50",
        "dark:bg-white dark:text-black dark:border-black",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 flex-shrink-0">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-wider">Breaking</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-scroll gap-8 whitespace-nowrap">
            {breakingNews.map((item, index) => (
              <React.Fragment key={item.id}>
                <span className="text-sm font-medium sinhala-text">{item.title}</span>
                {index < breakingNews.length - 1 && (
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                )}
              </React.Fragment>
            ))}
            {/* Duplicate for seamless loop */}
            {breakingNews.map((item, index) => (
              <React.Fragment key={`duplicate-${item.id}`}>
                <span className="text-sm font-medium sinhala-text">{item.title}</span>
                {index < breakingNews.length - 1 && (
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

