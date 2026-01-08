"use client";

import * as React from "react";
import { Play, Pause, ChevronRight, X, Maximize2 } from "lucide-react";
import { NewsItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QueueItem extends NewsItem {
  audioUrl?: string;
  audioBlob?: Blob;
}

interface MiniAudioPlayerProps {
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose?: () => void;
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>;
}

export function MiniAudioPlayer({
  queue,
  currentIndex,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onClose,
  audioRef,
}: MiniAudioPlayerProps) {
  const currentItem = queue[currentIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef?.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  if (!currentItem || queue.length === 0) {
    return null;
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t-2 border-black dark:border-white shadow-lg">
      {/* Progress Bar */}
      <div
        className="h-0.5 bg-gray-200 dark:bg-gray-800 cursor-pointer"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-black dark:bg-white transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Player Content - Compact */}
      <div className="flex items-center justify-between px-2 py-1.5 gap-2">
        {/* Left: Play Button + Track Info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button
            onClick={isPlaying ? onPause : onPlay}
            size="icon"
            className="h-8 w-8 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 flex-shrink-0"
          >
            {isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </Button>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold truncate sinhala-text text-black dark:text-white leading-tight">
              {currentItem.title}
            </h4>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="h-7 w-7 text-black dark:text-white"
          >
            <ChevronRight size={14} className="rotate-180" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={currentIndex >= queue.length - 1}
            className="h-7 w-7 text-black dark:text-white"
          >
            <ChevronRight size={14} />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-black dark:text-white"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

