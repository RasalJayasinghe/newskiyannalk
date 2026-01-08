"use client";

// Force dynamic rendering for static generation support
export const dynamic = 'force-dynamic';

import * as React from "react";
import { 
  Search, 
  Menu, 
  Play,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleNewsCard } from "@/components/simple-news-card";
import { SimpleAudioPlayer } from "@/components/simple-audio-player";
import { MiniAudioPlayer } from "@/components/mini-audio-player";
import { SimpleSidebar } from "@/components/simple-sidebar";
import { BreakingNewsTicker } from "@/components/breaking-news-ticker";
import { ThemeToggle } from "@/components/theme-toggle";
import { fetchNews, synthesizeText, checkHealth, NewsItem } from "@/lib/api";
import { useAudioQueue } from "@/contexts/audio-queue-context";
import { useListenLater } from "@/hooks/use-listen-later";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { cn } from "@/lib/utils";

type TimeFilter = "all" | "hour" | "today" | "yesterday";
type CategoryFilter = "all" | string;

const POLL_INTERVAL = 60 * 60 * 1000; // 1 hour

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeNavItem, setActiveNavItem] = React.useState("trending");

  // Filters
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>("all");
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>("all");

  // Audio Queue from Context
  const {
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
    playAudio: contextPlayAudio,
  } = useAudioQueue();

  // Listen Later
  const { items: listenLaterItems, addItem: addToListenLater, removeItem: removeFromListenLater, isInQueue: isInListenLater } = useListenLater();

  // Keyboard Navigation
  useKeyboardNavigation();

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(newsItems.map((item) => item.category));
    return ["all", ...Array.from(cats)];
  }, [newsItems]);

  // Get breaking news
  const breakingNews = React.useMemo(() => {
    return newsItems.filter((item) => item.isBreaking);
  }, [newsItems]);

  // Stats
  const stats = React.useMemo(() => {
    return {
      total: newsItems.length,
      breaking: breakingNews.length,
      saved: listenLaterItems.length,
    };
  }, [newsItems.length, breakingNews.length, listenLaterItems.length]);

  // Filter news
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
        const diffMs = now.getTime() - itemTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        switch (timeFilter) {
          case "hour":
            return diffHours < 1;
          case "today":
            return itemTime.toDateString() === now.toDateString();
          case "yesterday":
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return itemTime.toDateString() === yesterday.toDateString();
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.text.toLowerCase().includes(query)
      );
    }

    setFilteredNews(filtered);
  }, [newsItems, categoryFilter, timeFilter, searchQuery]);

  // Load news
  const loadNews = React.useCallback(async (silent = false) => {
    if (typeof window === 'undefined') return;
    if (!silent) setIsLoadingNews(true);
    setError(null);
    try {
      const response = await fetchNews();
      if (response.success) {
        setNewsItems(response.items);
        setLastUpdateTime(new Date());
      } else {
        setError(response.error || "Failed to fetch news");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch news");
    } finally {
      if (!silent) setIsLoadingNews(false);
    }
  }, []);

  // Health check and initial load
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkHealthStatus = async () => {
      try {
        const response = await checkHealth();
        setIsHealthy(response.status === "ok" && response.model_loaded);
      } catch (err) {
        setIsHealthy(false);
      } finally {
        setIsHealthCheckLoading(false);
      }
    };

    checkHealthStatus();
    loadNews();
  }, [loadNews]);

  // Polling
  React.useEffect(() => {
    if (typeof window === 'undefined' || !isHealthy) return;
    const interval = setInterval(() => {
      loadNews(true);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadNews, isHealthy]);


  // Generate audio for item
  const generateAudioForItem = async (item: NewsItem, queueIndex: number) => {
    if (isGenerating.has(item.id)) return;

    setIsGenerating((prev) => new Set(prev).add(item.id));
    try {
      const blob = await synthesizeText(item.text);
      const url = URL.createObjectURL(blob);

      updateQueueItem(queueIndex, { audioUrl: url, audioBlob: blob });

      if (queueIndex === currentIndex) {
        contextPlayAudio(url);
      }
    } catch (err) {
      console.error("Error generating audio:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate audio";
      if (errorMessage.includes("Failed to load TTS model")) {
        setError("TTS model is not loaded. Please contact the administrator to upload the model to Modal.");
      } else {
        setError(errorMessage);
      }
      updateQueueItem(queueIndex, { audioUrl: undefined, audioBlob: undefined });
    } finally {
      setIsGenerating((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // Handle play item
  const handlePlayItem = async (item: NewsItem) => {
    const existingIndex = queue.findIndex((q) => q.id === item.id);
    if (existingIndex !== -1) {
      setCurrentIndex(existingIndex);
      if (queue[existingIndex].audioUrl) {
        contextPlayAudio(queue[existingIndex].audioUrl!);
      } else {
        await generateAudioForItem(item, existingIndex);
      }
    } else {
      const newIndex = queue.length;
      addToQueue(item);
      setCurrentIndex(newIndex);
      await generateAudioForItem(item, newIndex);
    }
  };

  // Handle play all
  const handlePlayAll = async () => {
    if (filteredNews.length === 0) return;
    clearQueue();
    filteredNews.forEach((item) => addToQueue(item));
    setCurrentIndex(0);
    if (filteredNews.length > 0) {
      await generateAudioForItem(filteredNews[0], 0);
    }
  };

  // Handle play top 5
  const handlePlayTop5 = async () => {
    const top5 = filteredNews.slice(0, 5);
    if (top5.length === 0) return;
    clearQueue();
    top5.forEach((item) => addToQueue(item));
    setCurrentIndex(0);
    if (top5.length > 0) {
      await generateAudioForItem(top5[0], 0);
    }
  };


  // Playback controls
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

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      {/* Breaking News Ticker - Above everything */}
      {breakingNews.length > 0 && (
        <BreakingNewsTicker breakingNews={breakingNews} />
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <SimpleSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
        activeNavItem={activeNavItem}
        onNavItemChange={setActiveNavItem}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header 
          className={cn(
            "sticky z-40 h-16 bg-white dark:bg-black border-b-2 border-black dark:border-white flex items-center justify-between px-4 lg:px-8",
            breakingNews.length > 0 ? "top-[42px]" : "top-0"
          )}
        >
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-black dark:text-white"
            >
              <Menu size={24} />
            </Button>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="ප්‍රවෘත්ති සොයන්න..."
                className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm bg-white dark:bg-black text-black dark:text-white focus:border-black dark:focus:border-white sinhala-text max-w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-white dark:bg-black pt-8 pb-8 px-4 lg:px-8 border-b-2 border-black dark:border-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-2 sinhala-text text-black dark:text-white">
                  newskiyanna
                </h1>
                <p className="text-gray-600 dark:text-gray-400 sinhala-text">සිංහල පුවත් හඬ මගින්</p>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 text-center min-w-[80px] border-2 border-black dark:border-white">
                  <div className="text-xs sinhala-text mb-0.5 text-gray-600 dark:text-gray-400">සියල්ල</div>
                  <div className="text-lg font-bold font-mono text-black dark:text-white">{stats.total}</div>
                </div>
                <div className="px-4 py-2 text-center min-w-[80px] border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black">
                  <div className="text-xs sinhala-text mb-0.5">විශේෂ</div>
                  <div className="text-lg font-bold font-mono">{stats.breaking}</div>
                </div>
                <div className="px-4 py-2 text-center min-w-[80px] border-2 border-black dark:border-white">
                  <div className="text-xs sinhala-text mb-0.5 text-gray-600 dark:text-gray-400">සුරැකි</div>
                  <div className="text-lg font-bold font-mono text-black dark:text-white">{stats.saved}</div>
                </div>
              </div>
            </div>

            {/* Autoplay Consent */}
            {autoplayConsent === null && filteredNews.length > 0 && (
              <div className="border-2 border-black dark:border-white p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 lg:mb-6 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs sm:text-sm sinhala-text text-black dark:text-white flex-1">
                  ප්‍රධාන පුවත් 5ක් ස්වයංක්‍රීයව හඬ මගින් වාර්තා කිරීමට ඔබ කැමතිද?
                </p>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoplayConsent(false)}
                    className="border-2 border-black dark:border-white text-black dark:text-white flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    පසුවට
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setAutoplayConsent(true);
                      handlePlayTop5();
                    }}
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border-2 border-black dark:border-white flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    <Play size={14} className="mr-2" /> දැන් අහන්න
                  </Button>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mb-8 p-4 border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
                <AlertCircle size={18} className="text-black dark:text-white" />
                <span className="text-sm text-black dark:text-white">{error}</span>
              </div>
            )}

            {/* News Grid */}
            {isLoadingNews ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="border-2 border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 animate-pulse bg-white dark:bg-black">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-4"></div>
                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 sinhala-text">
                  සෙවීමට අදාළ පුවත් කිසිවක් හමු නොවීය.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredNews.map((item) => {
                  const queueIndex = queue.findIndex((q) => q.id === item.id);
                  const isCurrent = queueIndex !== -1 && queueIndex === currentIndex;

                  return (
                    <SimpleNewsCard
                      key={item.id}
                      news={item}
                      isPlaying={isCurrent && isPlaying}
                      isGenerating={isGenerating.has(item.id)}
                      onPlay={() => handlePlayItem(item)}
                      onListenLater={() => {
                        if (isInListenLater(item.id)) {
                          removeFromListenLater(item.id);
                        } else {
                          addToListenLater(item);
                        }
                      }}
                      isInListenLater={isInListenLater(item.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Add padding bottom for audio player */}
        {queue.length > 0 && <div className="h-20 lg:h-24"></div>}
      </main>
      </div>

      {/* Audio Player - Mini on mobile, Full on desktop */}
      {queue.length > 0 && (
        <>
          {/* Mini Player - Mobile only */}
          <MiniAudioPlayer
            queue={queue}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={handlePlay}
            onPause={() => {
              setIsPlaying(false);
              audioRef.current?.pause();
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onClose={() => {
              clearQueue();
            }}
            audioRef={audioRef}
          />
          
          {/* Full Player - Desktop only */}
          <SimpleAudioPlayer
            queue={queue}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onPlay={handlePlay}
            onPause={() => {
              setIsPlaying(false);
              audioRef.current?.pause();
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onVolumeChange={setVolume}
            audioRef={audioRef}
          />
        </>
      )}
    </div>
  );
}

