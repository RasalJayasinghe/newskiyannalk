"use client";

import * as React from "react";
import { NewsItem } from "@/lib/api";

export interface QueueItem extends NewsItem {
  audioUrl?: string;
  audioBlob?: Blob;
}

interface AudioQueueContextType {
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  duration: number;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  addToQueue: (item: NewsItem) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  updateQueueItem: (index: number, updates: Partial<QueueItem>) => void;
  playAudio: (url: string) => void;
}

const AudioQueueContext = React.createContext<AudioQueueContextType | undefined>(undefined);

export function AudioQueueProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = React.useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const addToQueue = React.useCallback((item: NewsItem) => {
    setQueue((prev) => {
      // Check if already in queue
      if (prev.some((q) => q.id === item.id)) {
        return prev;
      }
      return [...prev, { ...item }];
    });
  }, []);

  const removeFromQueue = React.useCallback((index: number) => {
    setQueue((prev) => {
      const newQueue = prev.filter((_, i) => i !== index);
      return newQueue;
    });
  }, []);

  const clearQueue = React.useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const updateQueueItem = React.useCallback((index: number, updates: Partial<QueueItem>) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      newQueue[index] = { ...newQueue[index], ...updates };
      return newQueue;
    });
  }, []);

  const playAudio = React.useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(url);
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    audio.play()
      .then(() => {
        setIsPlaying(true);
        setDuration(audio.duration);
      })
      .catch((err) => {
        console.error("Playback error:", err);
        setIsPlaying(false);
      });
  }, [playbackSpeed]);

  // Reset time when audio stops
  React.useEffect(() => {
    if (!isPlaying && audioRef.current === null) {
      setCurrentTime(0);
      setDuration(0);
    }
  }, [isPlaying]);

  const value = React.useMemo(
    () => ({
      queue,
      currentIndex,
      isPlaying,
      playbackSpeed,
      currentTime,
      duration,
      audioRef,
      addToQueue,
      removeFromQueue,
      clearQueue,
      setCurrentIndex,
      setIsPlaying,
      setPlaybackSpeed,
      updateQueueItem,
      playAudio,
    }),
    [
      queue,
      currentIndex,
      isPlaying,
      playbackSpeed,
      currentTime,
      duration,
      addToQueue,
      removeFromQueue,
      clearQueue,
      setPlaybackSpeed,
      updateQueueItem,
      playAudio,
    ]
  );

  return <AudioQueueContext.Provider value={value}>{children}</AudioQueueContext.Provider>;
}

export function useAudioQueue() {
  const context = React.useContext(AudioQueueContext);
  if (context === undefined) {
    throw new Error("useAudioQueue must be used within an AudioQueueProvider");
  }
  return context;
}

