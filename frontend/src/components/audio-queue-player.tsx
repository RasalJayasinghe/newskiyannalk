"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2,
  List,
  X
} from "lucide-react";
import { NewsItem } from "@/lib/api";

interface QueueItem extends NewsItem {
  audioUrl?: string;
  audioBlob?: Blob;
}

interface AudioQueuePlayerProps {
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSpeedChange: (speed: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onJumpTo?: (index: number) => void;
}

export function AudioQueuePlayer({
  queue,
  currentIndex,
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSpeedChange,
  onRemove,
  onClear,
  onJumpTo,
}: AudioQueuePlayerProps) {
  const speeds = [0.75, 1, 1.25, 1.5];

  if (queue.length === 0) {
    return null;
  }

  const currentItem = queue[currentIndex];

  return (
    <Card className="w-full sticky top-4 z-10">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Current Item Info */}
          {currentItem && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm line-clamp-1">
                  {currentItem.title}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} / {queue.length}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentItem.category} • {currentItem.time}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous"
              title="Previous (←)"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={isPlaying ? onPause : onPlay}
              className="h-10 w-10"
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={onNext}
              disabled={currentIndex >= queue.length - 1}
              aria-label="Next"
              title="Next (→)"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex-1" />

            {/* Speed Control */}
            <div className="flex items-center gap-1">
              {speeds.map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSpeedChange(speed)}
                  className="h-8 px-2 text-xs"
                >
                  {speed}x
                </Button>
              ))}
            </div>

            {queue.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="h-8 w-8"
                aria-label="Clear queue"
                title="Clear queue (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Queue List (Collapsible) */}
          {queue.length > 1 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {queue.map((item, index) => (
                <div
                  key={item.id}
                  className={`
                    flex items-center gap-2 p-2 rounded text-xs
                    ${index === currentIndex ? "bg-primary/10" : "hover:bg-muted"}
                    cursor-pointer
                  `}
                  onClick={() => {
                    if (index !== currentIndex && onJumpTo) {
                      onJumpTo(index);
                    }
                  }}
                >
                  <span className="text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <span className="flex-1 line-clamp-1">{item.title}</span>
                  {index !== currentIndex && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

