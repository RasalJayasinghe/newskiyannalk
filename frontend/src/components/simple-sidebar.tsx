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
}

export function SimpleSidebar({
  isOpen,
  onClose,
  activeCategory,
  onCategoryChange,
  categories,
}: SimpleSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-black sinhala-text">
              newskiyanna
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
            >
              <X size={24} />
            </Button>
          </div>

          <nav className="space-y-1 mb-8">
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <TrendingUp size={20} className="mr-3" />
              <span className="sinhala-text">අද දවසේ ප්‍රවණතා</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <Bookmark size={20} className="mr-3" />
              <span className="sinhala-text">සුරැකි පුවත්</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <Clock size={20} className="mr-3" />
              <span className="sinhala-text">පසුගිය පුවත්</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <Settings size={20} className="mr-3" />
              <span className="sinhala-text">සැකසුම්</span>
            </Button>
          </nav>

          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">
              වර්ගීකරණය
            </h2>
            <div className="space-y-1">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    activeCategory === cat && "bg-black text-white hover:bg-gray-800"
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

