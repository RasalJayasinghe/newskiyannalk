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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t-2 border-black dark:border-white shadow-lg lg:ml-64">
      {/* Progress Bar */}
      <div
        className="h-1 bg-gray-200 dark:bg-gray-800 cursor-pointer"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-black dark:bg-white transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Player Content */}
      <div className="flex items-center justify-between p-3 gap-3">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            onClick={isPlaying ? onPause : onPlay}
            size="icon"
            className="h-10 w-10 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 flex-shrink-0"
          >
            {isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
          </Button>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold truncate sinhala-text text-black dark:text-white">
              {currentItem.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {currentItem.time}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="h-8 w-8 text-black dark:text-white"
          >
            <ChevronRight size={18} className="rotate-180" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={currentIndex >= queue.length - 1}
            className="h-8 w-8 text-black dark:text-white"
          >
            <ChevronRight size={18} />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-black dark:text-white"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

