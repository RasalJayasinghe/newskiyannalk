"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NewsCard } from "@/components/news-card";
import { AudioQueuePlayer } from "@/components/audio-queue-player";
import { NewsTicker } from "@/components/news-ticker";
import { ThemeControls } from "@/components/theme-controls";
import { Loader2, AlertCircle, RefreshCw, Play, Clock } from "lucide-react";
import { fetchNews, synthesizeText, checkHealth, NewsItem } from "@/lib/api";
import { useAudioQueue } from "@/contexts/audio-queue-context";
import { useListenLater } from "@/hooks/use-listen-later";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { cn } from "@/lib/utils";

type TimeFilter = "all" | "hour" | "today" | "yesterday";
type CategoryFilter = "all" | string;

const POLL_INTERVAL = 60 * 60 * 1000; // 1 hour (60 minutes)

export default function Home() {
  const [newsItems, setNewsItems] = React.useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = React.useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isHealthy, setIsHealthy] = React.useState(false);
  const [isHealthCheckLoading, setIsHealthCheckLoading] = React.useState(true);
  const [autoplayConsent, setAutoplayConsent] = React.useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = React.useState<Set<number>>(new Set());
  const [lastUpdateTime, setLastUpdateTime] = React.useState<Date | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>("all");
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>("all");

  // Audio Queue from Context
  const {
    queue,
    currentIndex,
    isPlaying,
    playbackSpeed,
    audioRef,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setCurrentIndex,
    setIsPlaying,
    setPlaybackSpeed,
    updateQueueItem,
    playAudio: contextPlayAudio,
  } = useAudioQueue();

  // Listen Later
  const { items: listenLaterItems, addItem: addToListenLater, removeItem: removeFromListenLater, isInQueue: isInListenLater } = useListenLater();

  // Keyboard Navigation
  useKeyboardNavigation();

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(newsItems.map((item) => item.category));
    return Array.from(cats);
  }, [newsItems]);

  // Get breaking news
  const breakingNews = React.useMemo(() => {
    return newsItems.filter((item) => item.isBreaking);
  }, [newsItems]);

  // Check URL for shared news item
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newsId = params.get("news");
    if (newsId && newsItems.length > 0) {
      const item = newsItems.find((n) => n.id === parseInt(newsId));
      if (item) {
        // Scroll to and highlight the item
        setTimeout(() => {
          const element = document.getElementById(`news-${item.id}`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
          element?.classList.add("ring-2", "ring-primary");
          setTimeout(() => {
            element?.classList.remove("ring-2", "ring-primary");
          }, 3000);
        }, 500);
      }
    }
  }, [newsItems]);

  // Health check on mount
  React.useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const health = await checkHealth();
        setIsHealthy(health.model_loaded && health.status === "healthy");
      } catch (err) {
        setIsHealthy(false);
        console.error("Health check failed:", err);
      } finally {
        setIsHealthCheckLoading(false);
      }
    };

    checkApiHealth();
    loadNews();
  }, []);

  // Polling for real-time updates
  React.useEffect(() => {
    if (!isHealthy) return;

    const interval = setInterval(() => {
      loadNews(true); // Silent refresh
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [isHealthy]);

  // Filter news based on category and time
  React.useEffect(() => {
    let filtered = [...newsItems];

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((item) => {
        const itemTime = new Date(item.timestamp);
        const diffHours = (now.getTime() - itemTime.getTime()) / (1000 * 60 * 60);

        if (timeFilter === "hour") return diffHours < 1;
        if (timeFilter === "today") return diffHours < 24;
        if (timeFilter === "yesterday") return diffHours >= 24 && diffHours < 48;
        return true;
      });
    }

    setFilteredNews(filtered);
  }, [newsItems, categoryFilter, timeFilter]);

  // Audio playback control
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackSpeed;

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [playbackSpeed, queue, currentIndex]);

  const loadNews = async (silent = false) => {
    if (!silent) setIsLoadingNews(true);
    setError(null);
    try {
      const response = await fetchNews();
      if (response.success) {
        setNewsItems(response.items);
        setLastUpdateTime(new Date()); // Update timestamp
        
        // Auto-play top 5 if consent given and first load
        if (!silent && autoplayConsent === true && queue.length === 0) {
          const top5 = response.items.slice(0, 5);
          handlePlayTop5(top5);
        }
      } else {
        setError(response.error || "Failed to fetch news");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch news");
      console.error("Error loading news:", err);
    } finally {
      if (!silent) setIsLoadingNews(false);
    }
  };

  const generateAudioForItem = async (item: NewsItem, queueIndex: number) => {
    if (isGenerating.has(item.id)) return;

    setIsGenerating((prev) => new Set(prev).add(item.id));
    try {
      const blob = await synthesizeText(item.text);
      const url = URL.createObjectURL(blob);

      updateQueueItem(queueIndex, { audioUrl: url, audioBlob: blob });
      
      // Auto-play if it's the current item
      if (queueIndex === currentIndex) {
        contextPlayAudio(url);
      }
    } catch (err) {
      console.error("Error generating audio:", err);
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setIsGenerating((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handlePlayItem = async (item: NewsItem) => {
    // Check if item is already in queue
    const existingIndex = queue.findIndex((q) => q.id === item.id);
    if (existingIndex !== -1) {
      setCurrentIndex(existingIndex);
      if (queue[existingIndex].audioUrl) {
        contextPlayAudio(queue[existingIndex].audioUrl!);
      } else {
        await generateAudioForItem(item, existingIndex);
      }
    } else {
      // Add to queue and generate
      addToQueue(item);
      const newIndex = queue.length;
      setCurrentIndex(newIndex);
      await generateAudioForItem(item, newIndex);
    }
  };

  const handlePlayTop5 = async (items: NewsItem[]) => {
    // Add all to queue
    items.forEach((item) => addToQueue(item));
    
    // Generate and play first item
    if (items.length > 0) {
      setCurrentIndex(0);
      await generateAudioForItem(items[0], 0);
    }
  };

  const handlePlayAll = async () => {
    if (filteredNews.length === 0) return;

    // Clear existing queue
    clearQueue();

    // Add all filtered news to queue
    filteredNews.forEach((item) => addToQueue(item));
    setCurrentIndex(0);

    // Generate audio for first item and start playing
    if (filteredNews.length > 0) {
      await generateAudioForItem(filteredNews[0], 0);
    }
  };

  const handlePlay = () => {
    const current = queue[currentIndex];
    if (current?.audioUrl) {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        contextPlayAudio(current.audioUrl);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const next = queue[nextIndex];
      if (next?.audioUrl) {
        contextPlayAudio(next.audioUrl);
      } else if (next) {
        generateAudioForItem(next, nextIndex);
      }
    } else {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      const prev = queue[prevIndex];
      if (prev?.audioUrl) {
        contextPlayAudio(prev.audioUrl);
      }
    }
  };

  // Auto-play when audio is ready
  React.useEffect(() => {
    const current = queue[currentIndex];
    if (current?.audioUrl && !isPlaying && audioRef.current === null) {
      contextPlayAudio(current.audioUrl);
    }
  }, [queue, currentIndex, isPlaying, contextPlayAudio]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* News Ticker */}
      <NewsTicker breakingNews={breakingNews} />

      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header with Theme Controls */}
        <div className="flex items-center justify-between">
          <div className="text-center sm:text-left space-y-2 flex-1">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Sinhala News Reader
            </h1>
            <p className="text-muted-foreground text-lg">
              Listen to latest Sinhala news headlines
            </p>
          </div>
          <ThemeControls />
        </div>

        {/* Autoplay Consent */}
        {autoplayConsent === null && newsItems.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span>Would you like to automatically play the top 5 headlines?</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAutoplayConsent(false);
                  }}
                >
                  No Thanks
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAutoplayConsent(true);
                    handlePlayTop5(newsItems.slice(0, 5));
                  }}
                >
                  Yes, Play
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Health Status */}
        {!isHealthCheckLoading && (
          <Alert variant={isHealthy ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isHealthy
                ? "API is ready. You can start listening to news."
                : "API is not available. Please ensure the Flask server is running."}
            </AlertDescription>
          </Alert>
        )}

        {/* Audio Queue Player */}
        <AudioQueuePlayer
          queue={queue}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onPlay={handlePlay}
          onPause={() => {
            setIsPlaying(false);
            audioRef.current?.pause();
          }}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSpeedChange={setPlaybackSpeed}
          onRemove={removeFromQueue}
          onClear={clearQueue}
          onJumpTo={(index) => {
            setCurrentIndex(index);
            const item = queue[index];
            if (item?.audioUrl) {
              contextPlayAudio(item.audioUrl);
            } else if (item) {
              generateAudioForItem(item, index);
            }
          }}
        />

        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>News Headlines</CardTitle>
                <CardDescription>
                  {filteredNews.length} {filteredNews.length === 1 ? "අයිතමයක්" : "අයිතම"} හමු විය
                  {listenLaterItems.length > 0 && (
                    <span className="ml-2">
                      • <Clock className="inline h-3 w-3" /> {listenLaterItems.length} සුරක්ෂිත
                    </span>
                  )}
                  {lastUpdateTime && (
                    <span className="ml-2 text-xs">
                      • අවසන් යාවත්කාලීනය: {lastUpdateTime.toLocaleTimeString('si-LK', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => loadNews()}
                  disabled={isLoadingNews}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoadingNews && "animate-spin")} />
                </Button>
                <Button
                  onClick={handlePlayAll}
                  disabled={!isHealthy || filteredNews.length === 0 || isLoadingNews}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Play All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("all")}
              >
                All Categories
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Time Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={timeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter("all")}
              >
                All Time
              </Button>
              <Button
                variant={timeFilter === "hour" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter("hour")}
              >
                මේ පැය තුළ
              </Button>
              <Button
                variant={timeFilter === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter("today")}
              >
                අද
              </Button>
              <Button
                variant={timeFilter === "yesterday" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter("yesterday")}
              >
                ඊයේ
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* News Grid - 3 columns desktop, 1 mobile */}
            {isLoadingNews ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No news items found. Try adjusting filters or refresh.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNews.map((item) => {
                  const queueIndex = queue.findIndex((q) => q.id === item.id);
                  const isInQueue = queueIndex !== -1;
                  const isCurrent = isInQueue && queueIndex === currentIndex;

                  return (
                    <div key={item.id} id={`news-${item.id}`}>
                      <NewsCard
                        news={item}
                        isPlaying={isCurrent && isPlaying}
                        isQueued={isInQueue && !isCurrent}
                        isInListenLater={isInListenLater(item.id)}
                        onClick={() => handlePlayItem(item)}
                        onPlay={() => handlePlayItem(item)}
                        onListenLater={() => {
                          if (isInListenLater(item.id)) {
                            removeFromListenLater(item.id);
                          } else {
                            addToListenLater(item);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
