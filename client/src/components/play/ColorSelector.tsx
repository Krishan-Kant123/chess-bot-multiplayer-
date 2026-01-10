"use client";

import { Crown } from "lucide-react";

type ColorChoice = "white" | "black" | "random";

interface ColorSelectorProps {
    selectedColor: ColorChoice;
    onSelect: (color: ColorChoice) => void;
}

export function ColorSelector({ selectedColor, onSelect }: ColorSelectorProps) {
    return (
        <div className="mb-6 md:mb-8">
            <h3 className="font-display text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-2">
                <Crown className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                YOUR COLOR
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => onSelect("white")}
                    className={`flex-1 px-4 md:px-6 py-3 md:py-4 border rounded transition-all ${selectedColor === "white"
                        ? "border-accent bg-accent/10 text-white"
                        : "border-border text-foreground-muted hover:border-accent/50"
                        }`}
                >
                    <div className="text-3xl md:text-4xl mb-1 md:mb-2">♔</div>
                    <div className="font-semibold text-sm md:text-base">WHITE</div>
                    <div className="text-xs opacity-70">Move first</div>
                </button>

                <button
                    onClick={() => onSelect("black")}
                    className={`flex-1 px-4 md:px-6 py-3 md:py-4 border rounded transition-all ${selectedColor === "black"
                        ? "border-accent bg-accent/10 text-white"
                        : "border-border text-foreground-muted hover:border-accent/50"
                        }`}
                >
                    <div className="text-3xl md:text-4xl mb-1 md:mb-2">♚</div>
                    <div className="font-semibold text-sm md:text-base">BLACK</div>
                    <div className="text-xs opacity-70">Move second</div>
                </button>

                <button
                    onClick={() => onSelect("random")}
                    className={`flex-1 px-4 md:px-6 py-3 md:py-4 border rounded transition-all ${selectedColor === "random"
                        ? "border-accent bg-accent/10 text-white"
                        : "border-border text-foreground-muted hover:border-accent/50"
                        }`}
                >
                    <div className="text-3xl md:text-4xl mb-1 md:mb-2">⚡</div>
                    <div className="font-semibold text-sm md:text-base">RANDOM</div>
                    <div className="text-xs opacity-70">Surprise me</div>
                </button>
            </div>
        </div>
    );
}
