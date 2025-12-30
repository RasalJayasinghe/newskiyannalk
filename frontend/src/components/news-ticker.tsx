"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { NewsItem } from "@/lib/api";

interface NewsTickerProps {
  breakingNews: NewsItem[];
}

export function NewsTicker({ breakingNews }: NewsTickerProps) {
  if (breakingNews.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-destructive/10 border-b border-destructive/20 overflow-hidden">
      <div className="flex items-center gap-4 py-2">
        <div className="flex items-center gap-2 text-destructive font-semibold whitespace-nowrap">
          <AlertCircle className="h-4 w-4 animate-pulse" />
          <span>Breaking News</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="animate-scroll flex gap-8">
            {/* Duplicate for seamless loop */}
            {[...breakingNews, ...breakingNews].map((news, index) => (
              <span
                key={`${news.id}-${index}`}
                className="text-sm text-foreground whitespace-nowrap"
              >
                {news.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

