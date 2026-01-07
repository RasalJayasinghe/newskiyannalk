"use client";

import * as React from "react";
import { NewsItem } from "@/lib/api";

const STORAGE_KEY = "listen-later-queue";

export function useListenLater() {
  const [items, setItems] = React.useState<NewsItem[]>([]);

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      // localStorage not available or parse error (SSR safe)
    }
  }, []);

  // Save to localStorage whenever items change
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // localStorage not available (SSR safe)
    }
  }, [items]);

  const addItem = React.useCallback((item: NewsItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev; // Already exists
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = React.useCallback(() => {
    setItems([]);
  }, []);

  const isInQueue = React.useCallback(
    (id: number) => {
      return items.some((item) => item.id === id);
    },
    [items]
  );

  return {
    items,
    addItem,
    removeItem,
    clearAll,
    isInQueue,
    count: items.length,
  };
}

