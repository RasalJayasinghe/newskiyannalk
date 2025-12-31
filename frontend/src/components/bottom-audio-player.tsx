"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2,
  VolumeX,
  List,
  X
} from "lucide-react";
import { NewsItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface QueueItem extends NewsItem {
  audioUrl?: string;
  audioBlob?: Blob;
}

interface BottomAudioPlayerProps {
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  duration: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSpeedChange: (speed: number) => void;
  onVolumeChange: (volume: number) => void;
  onClear: () => void;
  onJumpTo?: (index: number) => void;
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function BottomAudioPlayer({
  queue,
  currentIndex,
  isPlaying,
  playbackSpeed,
  currentTime,
  duration,
  volume,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSpeedChange,
  onVolumeChange,
  onClear,
  onJumpTo,
  audioRef,
}: BottomAudioPlayerProps) {
  const speeds = [0.75, 1, 1.25, 1.5];
  const [showQueue, setShowQueue] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [previousVolume, setPreviousVolume] = React.useState(1);

  const currentItem = queue[currentIndex];

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef?.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Handle volume toggle
  const handleVolumeToggle = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  // Update audio volume when it changes
  React.useEffect(() => {
    if (audioRef?.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  if (queue.length === 0) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Fixed Bottom Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 dark:bg-black/95 backdrop-blur-xl border-t border-gray-800 dark:border-gray-700 p-3 sm:p-4 shadow-2xl z-50">
        <div className="flex items-center gap-2 sm:gap-4 max-w-7xl mx-auto">
          {/* Now Playing Info */}
          <div className="flex-1 min-w-0 hidden sm:block">
            <p className="text-xs text-gray-400 dark:text-gray-500">Now Playing</p>
            <p className="text-sm font-semibold truncate text-white dark:text-white">
              {currentItem?.title || "No item selected"}
            </p>
            {currentItem && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentItem.category} • {currentItem.time}
              </p>
            )}
          </div>

          {/* Mobile: Now Playing Info */}
          <div className="flex-1 min-w-0 sm:hidden">
            <p className="text-xs text-gray-400 dark:text-gray-500">Now Playing</p>
            <p className="text-sm font-semibold truncate text-white dark:text-white">
              {currentItem?.title || "No item selected"}
            </p>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="h-8 w-8 sm:h-10 sm:w-10 text-white hover:bg-white/10 disabled:opacity-30"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button
              onClick={isPlaying ? onPause : onPlay}
              className="h-10 w-10 sm:h-12 sm:w-12 bg-red-600 hover:bg-red-700 text-white rounded-full p-0"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={currentIndex >= queue.length - 1}
              className="h-8 w-8 sm:h-10 sm:w-10 text-white hover:bg-white/10 disabled:opacity-30"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Progress Bar - Desktop */}
          <div className="flex-1 hidden md:block">
            <div 
              className="h-1 bg-gray-700 dark:bg-gray-600 rounded-full cursor-pointer hover:h-1.5 transition-all"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-red-500 dark:bg-red-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Speed Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Speed Control */}
            <div className="hidden sm:flex items-center gap-1">
              {speeds.map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onSpeedChange(speed)}
                  className={cn(
                    "h-7 px-2 text-xs",
                    playbackSpeed === speed 
                      ? "bg-white/20 text-white hover:bg-white/30" 
                      : "text-white hover:bg-white/10"
                  )}
                >
                  {speed}x
                </Button>
              ))}
            </div>

            {/* Mobile Speed - Single Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const currentIndex = speeds.indexOf(playbackSpeed);
                const nextIndex = (currentIndex + 1) % speeds.length;
                onSpeedChange(speeds[nextIndex]);
              }}
              className="sm:hidden h-7 px-2 text-xs text-white hover:bg-white/10"
            >
              {playbackSpeed}x
            </Button>

            {/* Volume Control */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVolumeToggle}
                className="h-8 w-8 text-white hover:bg-white/10"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  onVolumeChange(newVolume);
                  if (newVolume > 0) setIsMuted(false);
                }}
                className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Mobile Volume - Icon Only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVolumeToggle}
              className="sm:hidden h-8 w-8 text-white hover:bg-white/10"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            {/* Queue Toggle */}
            {queue.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQueue(!showQueue)}
                className="h-8 w-8 text-white hover:bg-white/10"
                aria-label="Toggle queue"
              >
                <List className="h-4 w-4" />
              </Button>
            )}

            {/* Clear Queue */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-8 w-8 text-white hover:bg-white/10"
              aria-label="Clear queue"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar - Mobile */}
        {duration > 0 && (
          <div className="md:hidden mt-2">
            <div 
              className="h-1 bg-gray-700 dark:bg-gray-600 rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-red-500 dark:bg-red-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Queue Popup - Mobile */}
      {showQueue && queue.length > 1 && (
        <div className="fixed bottom-20 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-gray-800 p-4 max-h-64 overflow-y-auto z-40">
          <div className="max-w-7xl mx-auto space-y-2">
            <div className="text-xs text-gray-400 mb-2">Queue ({queue.length})</div>
            {queue.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded text-sm cursor-pointer transition-colors",
                  index === currentIndex 
                    ? "bg-red-600/20 text-white" 
                    : "text-gray-300 hover:bg-white/10"
                )}
                onClick={() => {
                  if (index !== currentIndex && onJumpTo) {
                    onJumpTo(index);
                  }
                  setShowQueue(false);
                }}
              >
                <span className="text-gray-400 w-6 text-xs">
                  {index + 1}
                </span>
                <span className="flex-1 line-clamp-1">{item.title}</span>
                {index === currentIndex && (
                  <span className="text-xs text-red-400">●</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind fixed player */}
      <div className="h-20 sm:h-24" />
    </>
  );
}

