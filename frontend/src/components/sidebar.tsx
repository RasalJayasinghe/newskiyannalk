"use client";

import * as React from "react";
import { 
  TrendingUp, 
  Bookmark, 
  Clock, 
  Settings, 
  X,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  dailyInsights: string;
}

const NavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all",
      active
        ? "bg-white/10 text-white shadow-lg shadow-black/20"
        : "text-gray-400 hover:text-white hover:bg-white/5"
    )}
  >
    {icon}
    <span className="sinhala-text">{label}</span>
  </button>
);

export function Sidebar({
  isOpen,
  onClose,
  activeCategory,
  onCategoryChange,
  categories,
  dailyInsights,
}: SidebarProps) {
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
          "fixed lg:static inset-y-0 left-0 z-50 w-72 transition-transform duration-300 transform lg:translate-x-0 glass border-r border-white/10",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent sinhala-text">
              පුවත් AI
            </h1>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-1">
            <NavItem
              icon={<TrendingUp size={20} />}
              label="අද දවසේ ප්‍රවණතා"
              active
            />
            <NavItem icon={<Bookmark size={20} />} label="සුරැකි පුවත්" />
            <NavItem icon={<Clock size={20} />} label="පසුගිය පුවත්" />
            <NavItem icon={<Settings size={20} />} label="සැකසුම්" />
          </nav>

          <div className="mt-12">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">
              වර්ගීකරණය
            </h2>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    activeCategory === cat
                      ? "bg-red-500/10 text-red-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {cat === "all" ? "සියල්ල" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="mt-12 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">
                AI විවරණය
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed sinhala-text line-clamp-4">
              {dailyInsights}
            </p>
            <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              වැඩි විස්තර <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

