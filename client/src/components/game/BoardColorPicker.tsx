"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Palette, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BoardColors {
    light: string;
    dark: string;
}

const DEFAULT_COLORS: BoardColors = {
    light: "#4e4e4eff",
    dark: "#2b2b2bff",
};

const PRESET_THEMES = [
    { name: "Default", light: "#4e4e4eff", dark: "#2b2b2bff" },
    { name: "Classic", light: "#f0d9b5", dark: "#b58863" },
    { name: "Blue", light: "#dee3e6", dark: "#8ca2ad" },
    { name: "Green", light: "#ffffdd", dark: "#86a666" },
    { name: "Brown", light: "#f0d9b5", dark: "#946f51" },
    { name: "Purple", light: "#e8d5f0", dark: "#9b6fb8" },
    { name: "Ocean", light: "#c9e4f5", dark: "#5b8fa3" },
    { name: "Coral", light: "#ffd5c2", dark: "#e07856" },
];

interface BoardColorPickerProps {
    onColorsChange?: (colors: BoardColors) => void;
}

export function BoardColorPicker({ onColorsChange }: BoardColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [colors, setColors] = useState<BoardColors>(DEFAULT_COLORS);

    // Load colors from localStorage on mount
    useEffect(() => {
        const savedColors = localStorage.getItem("chessboard-colors");
        if (savedColors) {
            try {
                const parsed = JSON.parse(savedColors);
                setColors(parsed);
                onColorsChange?.(parsed);
            } catch (error) {
                console.error("Error loading board colors:", error);
            }
        }
    }, []);

    const handleColorChange = (newColors: BoardColors) => {
        setColors(newColors);
        localStorage.setItem("chessboard-colors", JSON.stringify(newColors));
        onColorsChange?.(newColors);

        // Dispatch custom event to notify other components in the same page
        window.dispatchEvent(new CustomEvent("board-colors-changed", { detail: newColors }));
    };

    const handlePresetSelect = (preset: BoardColors) => {
        handleColorChange(preset);
    };

    const handleReset = () => {
        handleColorChange(DEFAULT_COLORS);
    };

    const handleCustomColorChange = (type: "light" | "dark", value: string) => {
        const newColors = { ...colors, [type]: value };
        handleColorChange(newColors);
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative"
                title="Customize Board Colors"
            >
                <Palette className="w-4 h-4" />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Color Picker Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-4 bottom-4 md:absolute md:inset-auto md:right-0 md:top-12 md:bottom-auto z-50 md:w-80"
                        >
                            <Card className="p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display text-sm">BOARD COLORS</h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleReset}
                                            className="text-xs"
                                        >
                                            <RotateCcw className="w-3 h-3 mr-1" />
                                            RESET
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsOpen(false)}
                                            className="h-8 w-8"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Custom Color Pickers */}
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="text-xs text-foreground-dim mb-1 block">
                                            Light Squares
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={colors.light}
                                                onChange={(e) =>
                                                    handleCustomColorChange("light", e.target.value)
                                                }
                                                className="w-12 h-8 rounded cursor-pointer border border-border"
                                            />
                                            <input
                                                type="text"
                                                value={colors.light}
                                                onChange={(e) =>
                                                    handleCustomColorChange("light", e.target.value)
                                                }
                                                className="flex-1 px-2 py-1 text-xs bg-background-elevated border border-border rounded font-mono"
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-foreground-dim mb-1 block">
                                            Dark Squares
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={colors.dark}
                                                onChange={(e) =>
                                                    handleCustomColorChange("dark", e.target.value)
                                                }
                                                className="w-12 h-8 rounded cursor-pointer border border-border"
                                            />
                                            <input
                                                type="text"
                                                value={colors.dark}
                                                onChange={(e) =>
                                                    handleCustomColorChange("dark", e.target.value)
                                                }
                                                className="flex-1 px-2 py-1 text-xs bg-background-elevated border border-border rounded font-mono"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preset Themes */}
                                <div>
                                    <label className="text-xs text-foreground-dim mb-2 block">
                                        PRESET THEMES
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {PRESET_THEMES.map((preset) => (
                                            <button
                                                key={preset.name}
                                                onClick={() => handlePresetSelect(preset)}
                                                className="group relative"
                                                title={preset.name}
                                            >
                                                <div className="w-full aspect-square rounded border-2 border-border hover:border-accent transition-colors overflow-hidden">
                                                    <div
                                                        className="h-1/2"
                                                        style={{ backgroundColor: preset.light }}
                                                    />
                                                    <div
                                                        className="h-1/2"
                                                        style={{ backgroundColor: preset.dark }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-foreground-dim group-hover:text-accent transition-colors mt-1 block text-center">
                                                    {preset.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="mt-4">
                                    <label className="text-xs text-foreground-dim mb-2 block">
                                        PREVIEW
                                    </label>
                                    <div className="grid grid-cols-8 w-full aspect-square border border-border rounded overflow-hidden">
                                        {Array.from({ length: 64 }).map((_, i) => {
                                            const row = Math.floor(i / 8);
                                            const col = i % 8;
                                            const isLight = (row + col) % 2 === 0;
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        backgroundColor: isLight
                                                            ? colors.light
                                                            : colors.dark,
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// Hook to use board colors
export function useBoardColors() {
    const [colors, setColors] = useState<BoardColors>(DEFAULT_COLORS);

    useEffect(() => {
        const savedColors = localStorage.getItem("chessboard-colors");
        if (savedColors) {
            try {
                const parsed = JSON.parse(savedColors);
                setColors(parsed);
            } catch (error) {
                console.error("Error loading board colors:", error);
            }
        }

        // Listen for custom event (same tab changes)
        const handleColorChange = (e: Event) => {
            const customEvent = e as CustomEvent<BoardColors>;
            if (customEvent.detail) {
                setColors(customEvent.detail);
            }
        };

        // Listen for storage changes (different tab changes)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "chessboard-colors" && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setColors(parsed);
                } catch (error) {
                    console.error("Error parsing board colors:", error);
                }
            }
        };

        window.addEventListener("board-colors-changed", handleColorChange);
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("board-colors-changed", handleColorChange);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    return colors;
}
