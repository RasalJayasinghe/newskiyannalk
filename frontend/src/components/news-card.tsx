"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Volume2, Bookmark, BookmarkCheck } from "lucide-react";
import { NewsItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ShareButton } from "./share-button";

interface NewsCardProps {
  news: NewsItem;
  isPlaying?: boolean;
  isQueued?: boolean;
  isInListenLater?: boolean;
  onClick?: () => void;
  onPlay?: () => void;
  onListenLater?: () => void;
}

export function NewsCard({ 
  news, 
  isPlaying, 
  isQueued, 
  isInListenLater,
  onClick, 
  onPlay,
  onListenLater 
}: NewsCardProps) {
  const categoryColors: Record<string, string> = {
    "උණුසුම් පුවත්": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "ක්‍රීඩා": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "ව්‍යාපාරික": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "රජය": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "කලා": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    "තාක්ෂණ": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02] hover:border-primary/50",
        "active:scale-[0.98]",
        isPlaying && "ring-2 ring-primary shadow-lg",
        isQueued && "opacity-75"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            {news.isBreaking && (
              <Badge variant="destructive" className="text-xs">
                Breaking News
              </Badge>
            )}
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {news.title}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {onListenLater && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onListenLater();
                }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                title={isInListenLater ? "Remove from Listen Later" : "Add to Listen Later"}
              >
                {isInListenLater ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </button>
            )}
            {onPlay && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay();
                }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                title="Play this news"
              >
                <Volume2 className={cn("h-4 w-4", isPlaying && "text-primary")} />
              </button>
            )}
            <ShareButton newsItem={news} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-xs", categoryColors[news.category] || "")}
            >
              {news.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{news.time}</span>
            </div>
          </div>
          <a
            href={news.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

