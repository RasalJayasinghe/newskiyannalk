"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  Monitor,
  Eye,
  Type,
  Contrast,
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ThemeControls() {
  const { theme, setTheme, accessibility, setAccessibility, toggleAccessibility } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : theme === "light" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
          <span className="sr-only">Theme and Accessibility</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Accessibility</DropdownMenuLabel>
        <div className="px-2 py-1.5 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="accessibility-toggle" className="flex items-center gap-2 cursor-pointer">
              <Eye className="h-4 w-4" />
              <span>Accessibility Mode</span>
            </Label>
            <Switch
              id="accessibility-toggle"
              checked={accessibility.enabled}
              onCheckedChange={toggleAccessibility}
            />
          </div>
          {accessibility.enabled && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast" className="flex items-center gap-2 cursor-pointer">
                  <Contrast className="h-4 w-4" />
                  <span>High Contrast</span>
                </Label>
                <Switch
                  id="high-contrast"
                  checked={accessibility.highContrast}
                  onCheckedChange={(checked) =>
                    setAccessibility({ ...accessibility, highContrast: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="large-text" className="flex items-center gap-2 cursor-pointer">
                  <Type className="h-4 w-4" />
                  <span>Large Text</span>
                </Label>
                <Switch
                  id="large-text"
                  checked={accessibility.largeText}
                  onCheckedChange={(checked) =>
                    setAccessibility({ ...accessibility, largeText: checked })
                  }
                />
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

