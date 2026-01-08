"use client";

import * as React from "react";
import { Play, Pause, ChevronRight, Volume2 } from "lucide-react";
import { NewsItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QueueItem extends NewsItem {
  audioUrl?: string;
  audioBlob?: Blob;
}

interface SimpleAudioPlayerProps {
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>;
}

export function SimpleAudioPlayer({
  queue,
  currentIndex,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onVolumeChange,
  audioRef,
}: SimpleAudioPlayerProps) {
  const currentItem = queue[currentIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef?.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  if (!currentItem) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-black p-4 lg:ml-64 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left: Current Track Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold truncate sinhala-text text-black">
            {currentItem.title}
          </h4>
          <p className="text-xs text-gray-600 truncate">
            {currentItem.time}
          </p>
        </div>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-4 flex-1 justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          <ChevronRight size={24} className="rotate-180" />
        </Button>
        <Button
          onClick={isPlaying ? onPause : onPlay}
          size="icon"
          className="h-12 w-12 rounded-full bg-black text-white hover:bg-gray-800"
        >
          {isPlaying ? (
            <Pause size={20} fill="white" />
          ) : (
            <Play size={20} fill="white" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={currentIndex >= queue.length - 1}
        >
          <ChevronRight size={24} />
        </Button>
      </div>

      {/* Right: Volume */}
      <div className="flex items-center gap-2 w-32 flex-1 justify-end">
        <Volume2 size={16} className="text-gray-600" />
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-black transition-all"
            style={{ width: `${volume * 100}%` }}
          ></div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Progress Bar (Full Width) */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gray-200 cursor-pointer"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-black transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

