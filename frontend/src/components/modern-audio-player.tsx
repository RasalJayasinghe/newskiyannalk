"use client";

import * as React from "react";
import { Play, Pause, ChevronRight, Volume2, Settings } from "lucide-react";
import { NewsItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface QueueItem extends NewsItem {
  audioUrl?: string;
  audioBlob?: Blob;
}

interface ModernAudioPlayerProps {
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

export function ModernAudioPlayer({
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
}: ModernAudioPlayerProps) {
  const currentItem = queue[currentIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate placeholder image
  const imageUrl = currentItem
    ? `https://picsum.photos/seed/${currentItem.id}/100`
    : "https://picsum.photos/seed/default/100";

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
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 p-4 lg:p-6 lg:ml-72 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left: Current Track Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-red-500/20 overflow-hidden flex-shrink-0">
          <img
            src={imageUrl}
            alt="Current"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold truncate sinhala-text">
            පුවත් කියවන්නා: සිංහල AI හඬ
          </h4>
          <p className="text-xs text-gray-400 truncate sinhala-text">
            දැන් වාදනය වේ: {currentItem.title}
          </p>
        </div>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-6 flex-1 justify-center">
        <button
          onClick={onPrevious}
          className="text-gray-400 hover:text-white transition-colors"
          disabled={currentIndex === 0}
        >
          <ChevronRight
            size={24}
            className="rotate-180"
            strokeWidth={2.5}
          />
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
        >
          {isPlaying ? (
            <Pause size={20} fill="black" />
          ) : (
            <Play size={20} fill="black" />
          )}
        </button>
        <button
          onClick={onNext}
          className="text-gray-400 hover:text-white transition-colors"
          disabled={currentIndex >= queue.length - 1}
        >
          <ChevronRight size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right: Volume & Settings */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        <div className="flex items-center gap-2 w-32">
          <Volume2 size={16} className="text-gray-400" />
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-red-500 transition-all"
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
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
      </div>

      {/* Progress Bar (Full Width) */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-white/5 cursor-pointer"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-red-500 transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

