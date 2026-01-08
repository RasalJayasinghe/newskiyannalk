"use client";

import * as React from "react";
import { X, TrendingUp, Bookmark, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SimpleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  activeNavItem?: string;
  onNavItemChange?: (item: string) => void;
}

export function SimpleSidebar({
  isOpen,
  onClose,
  activeCategory,
  onCategoryChange,
  categories,
  activeNavItem = "trending",
  onNavItemChange,
}: SimpleSidebarProps) {
  const navItems = [
    { id: "trending", icon: TrendingUp, label: "අද දවසේ ප්‍රවණතා" },
    { id: "saved", icon: Bookmark, label: "සුරැකි පුවත්" },
    { id: "past", icon: Clock, label: "පසුගිය පුවත්" },
    { id: "settings", icon: Settings, label: "සැකසුම්" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-white/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64",
          "bg-white dark:bg-black",
          "border-r-2 border-black dark:border-white",
          "transition-transform duration-300 transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-black dark:text-white sinhala-text">
              newskiyanna
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-black dark:text-white"
            >
              <X size={24} />
            </Button>
          </div>

          <nav className="space-y-1 mb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavItem === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isActive
                      ? "bg-black dark:bg-white text-white dark:text-black font-semibold"
                      : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                  )}
                  onClick={() => onNavItemChange?.(item.id)}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="sinhala-text">{item.label}</span>
                </Button>
              );
            })}
          </nav>

          <div>
            <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4 px-3">
              වර්ගීකරණය
            </h2>
            <div className="space-y-1">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sm",
                    activeCategory === cat
                      ? "bg-black dark:bg-white text-white dark:text-black font-semibold"
                      : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                  )}
                  onClick={() => onCategoryChange(cat)}
                >
                  {cat === "all" ? "සියල්ල" : cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

