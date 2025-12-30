"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { NewsItem } from "@/lib/api";

interface ShareButtonProps {
  newsItem: NewsItem;
  className?: string;
}

export function ShareButton({ newsItem, className }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
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
    <Button
      variant="ghost"
      size="icon"
      onClick={handleShare}
      className={className}
      title="Share this news"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}

