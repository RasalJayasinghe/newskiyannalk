"use client";

import * as React from "react";
import { Bookmark, Share2, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { NewsItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ShareButton } from "./share-button";

interface ModernNewsCardProps {
  news: NewsItem;
  isPlaying?: boolean;
  isGenerating?: boolean;
  onPlay?: () => void;
  onListenLater?: () => void;
  onSummarize?: () => void;
  isSummarizing?: boolean;
  summary?: string;
  isInListenLater?: boolean;
}

export function ModernNewsCard({
  news,
  isPlaying,
  isGenerating,
  onPlay,
  onListenLater,
  onSummarize,
  isSummarizing,
  summary,
  isInListenLater,
}: ModernNewsCardProps) {
  // Generate a placeholder image URL based on news ID
  const imageUrl = `https://picsum.photos/seed/${news.id}/800/450`;

  const categoryMap: Record<string, string> = {
    "උණුසුම් පුවත්": "POLITICS",
    "ක්‍රීඩා": "SPORTS",
    "ව්‍යාපාරික": "BUSINESS",
    "රජය": "POLITICS",
    "කලා": "ENTERTAINMENT",
    "තාක්ෂණ": "TECH",
  };

  const categoryLabel = categoryMap[news.category] || news.category.toUpperCase();

  return (
    <div
      className={cn(
        "group relative glass rounded-2xl overflow-hidden border border-white/10",
        "hover:border-red-500/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10",
        isPlaying && "ring-2 ring-red-500/50"
      )}
    >
      {news.isBreaking && (
        <div className="absolute top-4 left-4 z-10">
          <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 text-[10px] font-bold text-white rounded-md uppercase tracking-tighter">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>{" "}
            Breaking
          </span>
        </div>
      )}

      {/* Image Section */}
      <div className="aspect-video relative overflow-hidden">
        <img
          src={imageUrl}
          alt={news.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded uppercase">
            {categoryLabel}
          </span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onListenLater && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onListenLater();
                }}
                className="p-1.5 rounded-full bg-black/40 text-white hover:bg-red-500 transition-colors"
              >
                <Bookmark
                  size={14}
                  className={cn(isInListenLater && "fill-white")}
                />
              </button>
            )}
            <ShareButton newsItem={news} className="p-1.5 rounded-full bg-black/40 text-white hover:bg-red-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 className="text-lg font-bold mb-3 leading-snug sinhala-text line-clamp-2 group-hover:text-red-400 transition-colors">
          {news.title}
        </h3>
        <p className="text-sm text-gray-400 mb-6 sinhala-text line-clamp-2 leading-relaxed">
          {news.text || news.title}
        </p>

        {/* AI Summary Section */}
        {onSummarize && (
          <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={12} /> AI සාරාංශය
              </div>
              {!summary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSummarize();
                  }}
                  disabled={isSummarizing}
                  className={cn(
                    "text-[10px] font-bold text-gray-400 hover:text-white underline decoration-indigo-500/40 underline-offset-4",
                    isSummarizing && "animate-pulse"
                  )}
                >
                  {isSummarizing ? "ජනනය කරමින්..." : "ජනනය කරන්න"}
                </button>
              )}
            </div>
            {summary ? (
              <p className="text-xs text-gray-300 sinhala-text leading-relaxed animate-in fade-in slide-in-from-top-1">
                {summary}
              </p>
            ) : (
              <div className="h-4 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-indigo-500/20"></div>
                <div className="w-1 h-1 rounded-full bg-indigo-500/20"></div>
                <div className="w-1 h-1 rounded-full bg-indigo-500/20"></div>
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <Loader2 className="h-6 w-6 animate-spin text-red-500" />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold">
              NT
            </div>
            <span className="text-[10px] text-gray-500 uppercase font-medium">
              NEWS TEAM • {news.time}
            </span>
          </div>
          <a
            href={news.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors group/btn"
          >
            වැඩිදුර කියවන්න{" "}
            <ChevronRight
              size={14}
              className="group-hover/btn:translate-x-1 transition-transform"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

