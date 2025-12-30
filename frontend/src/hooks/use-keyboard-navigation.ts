"use client";

import * as React from "react";

export function useKeyboardNavigation() {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Space: Play/Pause
      if (e.key === " " && !e.shiftKey) {
        e.preventDefault();
        const playButton = document.querySelector('[aria-label*="play" i], [title*="play" i]') as HTMLElement;
        playButton?.click();
      }

      // Arrow Left: Previous
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevButton = document.querySelector('[aria-label*="previous" i], [title*="previous" i]') as HTMLElement;
        prevButton?.click();
      }

      // Arrow Right: Next
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextButton = document.querySelector('[aria-label*="next" i], [title*="next" i]') as HTMLElement;
        nextButton?.click();
      }

      // Escape: Stop/Clear
      if (e.key === "Escape") {
        const clearButton = document.querySelector('[aria-label*="clear" i], [title*="clear" i]') as HTMLElement;
        clearButton?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

