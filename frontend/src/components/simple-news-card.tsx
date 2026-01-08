"use client";

import * as React from "react";
import { Play, Bookmark, BookmarkCheck } from "lucide-react";
import { NewsItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SimpleNewsCardProps {
  news: NewsItem;
  isPlaying?: boolean;
  isGenerating?: boolean;
  onPlay?: () => void;
  onListenLater?: () => void;
  isInListenLater?: boolean;
}

export function SimpleNewsCard({
  news,
  isPlaying,
  isGenerating,
  onPlay,
  onListenLater,
  isInListenLater,
}: SimpleNewsCardProps) {
  return (
    <Card
      className={cn(
        "group relative transition-all duration-200 hover:shadow-lg border-2",
        isPlaying ? "border-black shadow-lg" : "border-gray-200 hover:border-gray-400"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {news.isBreaking && (
              <Badge variant="destructive" className="mb-2 text-xs">
                Breaking
              </Badge>
            )}
            <h3 className="font-semibold text-base leading-snug sinhala-text line-clamp-2 mb-2">
              {news.title}
            </h3>
            <p className="text-xs text-gray-600 mb-2">{news.time}</p>
          </div>
          
          {/* Play Button - Prominent */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
            disabled={isGenerating}
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full flex-shrink-0",
              isPlaying
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-white border-2 border-black text-black hover:bg-gray-100"
            )}
          >
            {isGenerating ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={20} className={isPlaying ? "fill-white" : "fill-black"} />
            )}
          </Button>
        </div>

        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {news.category}
          </Badge>
          
          {onListenLater && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onListenLater();
              }}
              className="h-8 w-8"
            >
              {isInListenLater ? (
                <BookmarkCheck className="h-4 w-4 text-black" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

