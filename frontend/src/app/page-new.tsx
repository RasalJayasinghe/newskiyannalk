"use client";

// Force dynamic rendering for static generation support
export const dynamic = 'force-dynamic';

import * as React from "react";
import { 
  Mic, 
  Search, 
  Bell, 
  Menu, 
  X, 
  Zap, 
  Play, 
  Volume2,
  Loader2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { ModernNewsCard } from "@/components/modern-news-card";
import { ModernAudioPlayer } from "@/components/modern-audio-player";
import { Sidebar } from "@/components/sidebar";
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
  const [aiSummaryId, setAiSummaryId] = React.useState<string | null>(null);
  const [summaries, setSummaries] = React.useState<Record<string, string>>({});
  const [dailyInsights, setDailyInsights] = React.useState<string>(
    "අද දිනයේ ප්‍රධාන ප්‍රවණතා විශ්ලේෂණය කිරීමට සූදානම් වෙමින්..."
  );

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

  // Health check
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
  }, []);

  // Load news
  const loadNews = React.useCallback(async (silent = false) => {
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

  // Initial load
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      loadNews();
    }
  }, [loadNews]);

  // Polling
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const interval = setInterval(() => {
      loadNews(true);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadNews]);

  // Generate AI insights (mock for now)
  React.useEffect(() => {
    if (newsItems.length > 0) {
      const titles = newsItems.slice(0, 5).map((n) => n.title).join(", ");
      // Mock AI insights - in future can integrate with actual AI service
      setDailyInsights(
        `අද දිනයේ ප්‍රධාන ප්‍රවණතා විශ්ලේෂණය: ${titles.substring(0, 100)}...`
      );
    }
  }, [newsItems]);

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

  // Handle summarize (mock for now)
  const handleSummarize = async (id: string, content: string) => {
    if (summaries[id]) return;
    setAiSummaryId(id);
    // Mock summary - in future can integrate with actual AI service
    setTimeout(() => {
      setSummaries((prev) => ({
        ...prev,
        [id]: "මෙම පුවත පිළිබඳ AI සාරාංශය මෙහි දිස්වනු ඇත. (AI summary will appear here)",
      }));
      setAiSummaryId(null);
    }, 1500);
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
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
        dailyInsights={dailyInsights}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 glass border-b border-white/10 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="ප්‍රවෘත්ති සොයන්න..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all sinhala-text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 p-[1px]">
              <div className="h-full w-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                <span className="text-xs font-bold text-white">U</span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-red-900/20 via-[#0a0a0a] to-[#0a0a0a] pt-8 pb-12 px-4 lg:px-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full -mr-48 -mt-48"></div>

          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold mb-4 sinhala-text leading-tight tracking-tight">
                  සිංහල පුවත්{" "}
                  <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
                    AI බලයෙන්
                  </span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 rounded-full text-gray-400">
                    <Mic size={14} />
                    AI හඬ කියවීම්
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 rounded-full text-gray-400">
                    <Zap size={14} />
                    තත්‍ය කාලීන යාවත්කාලීන
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 rounded-xl text-center min-w-[80px] border bg-white/5 border-white/10 text-gray-300">
                  <div className="text-xs opacity-80 sinhala-text mb-0.5">සියල්ල</div>
                  <div className="text-lg font-bold font-mono">{stats.total}</div>
                </div>
                <div className="px-4 py-2 rounded-xl text-center min-w-[80px] border bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20">
                  <div className="text-xs opacity-80 sinhala-text mb-0.5">විශේෂ</div>
                  <div className="text-lg font-bold font-mono">{stats.breaking}</div>
                </div>
                <div className="px-4 py-2 rounded-xl text-center min-w-[80px] border bg-white/5 border-white/10 text-gray-300">
                  <div className="text-xs opacity-80 sinhala-text mb-0.5">සුරැකි</div>
                  <div className="text-lg font-bold font-mono">{stats.saved}</div>
                </div>
              </div>
            </div>

            {/* Notification Alert */}
            {autoplayConsent === null && filteredNews.length > 0 && (
              <div className="glass rounded-2xl p-4 flex items-center justify-between border-red-500/20 bg-red-500/5 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                    <Volume2 size={20} />
                  </div>
                  <p className="text-sm text-gray-300 sinhala-text">
                    ප්‍රධාන පුවත් 5ක් ස්වයංක්‍රීයව හඬ මගින් වාර්තා කිරීමට ඔබ කැමතිද?
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAutoplayConsent(false)}
                    className="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    පසුවට
                  </button>
                  <button
                    onClick={() => {
                      setAutoplayConsent(true);
                      handlePlayTop5();
                    }}
                    className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Play size={14} fill="white" /> දැන් අහන්න
                  </button>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* News Grid */}
            {isLoadingNews ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                    <div className="aspect-video bg-white/10 rounded-lg mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 sinhala-text">
                  සෙවීමට අදාළ පුවත් කිසිවක් හමු නොවීය.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredNews.map((item) => {
                  const queueIndex = queue.findIndex((q) => q.id === item.id);
                  const isCurrent = queueIndex !== -1 && queueIndex === currentIndex;

                  return (
                    <ModernNewsCard
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
                      onSummarize={() => handleSummarize(item.id.toString(), item.text)}
                      isSummarizing={aiSummaryId === item.id.toString()}
                      summary={summaries[item.id.toString()]}
                      isInListenLater={isInListenLater(item.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modern Audio Player */}
      {queue.length > 0 && (
        <ModernAudioPlayer
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
      )}
    </div>
  );
}

