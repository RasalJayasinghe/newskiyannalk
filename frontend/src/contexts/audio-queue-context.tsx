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
  volume: number;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  addToQueue: (item: NewsItem) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
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
  const [volume, setVolume] = React.useState(1);
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
    // #region agent log
    if (typeof window !== 'undefined') fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'audio-queue-context.tsx:78',message:'playAudio entry',data:{url,playback_speed:playbackSpeed,volume,has_audio_ref:!!audioRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(url);
    audio.playbackRate = playbackSpeed;
    audio.volume = volume;
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

    // #region agent log
    if (typeof window !== 'undefined') fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'audio-queue-context.tsx:104',message:'playAudio calling audio.play',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    audio.play()
      .then(() => {
        // #region agent log
        if (typeof window !== 'undefined') fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'audio-queue-context.tsx:107',message:'playAudio play success',data:{duration:audio.duration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setIsPlaying(true);
        setDuration(audio.duration);
      })
      .catch((err) => {
        // #region agent log
        if (typeof window !== 'undefined') fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'audio-queue-context.tsx:110',message:'playAudio play error',data:{error_type:err.constructor.name,error_message:err.message,error_name:err.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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

  // Update audio volume when it changes
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const value = React.useMemo(
    () => ({
      queue,
      currentIndex,
      isPlaying,
      playbackSpeed,
      currentTime,
      duration,
      volume,
      audioRef,
      addToQueue,
      removeFromQueue,
      clearQueue,
      setCurrentIndex,
      setIsPlaying,
      setPlaybackSpeed,
      setVolume,
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
      volume,
      addToQueue,
      removeFromQueue,
      clearQueue,
      setPlaybackSpeed,
      setVolume,
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

