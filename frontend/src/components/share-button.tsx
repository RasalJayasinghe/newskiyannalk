"use client";

import * as React from "react";
import { Share2, Check } from "lucide-react";
import { NewsItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  newsItem: NewsItem;
  className?: string;
}

export function ShareButton({ newsItem, className }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}?news=${newsItem.id}`;
    const shareText = `${newsItem.title}\n\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: newsItem.title,
          text: newsItem.title,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled");
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleShare();
      }}
      className={cn(
        "p-1.5 rounded-full bg-black/40 text-white hover:bg-red-500 transition-colors",
        className
      )}
      title="Share this news"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Share2 size={14} />
      )}
    </button>
  );
}

