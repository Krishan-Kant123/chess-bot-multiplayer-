"use client";

import { Bot } from "lucide-react";

interface AILevel {
    level: number;
    label: string;
    rating: string;
}

interface AILevelSelectorProps {
    selectedLevel: number;
    onSelect: (level: number) => void;
}

const aiLevels: AILevel[] = [
    { level: 1, label: "BEGINNER", rating: "~400" },
    { level: 3, label: "EASY", rating: "~800" },
    { level: 5, label: "MEDIUM", rating: "~1200" },
    { level: 7, label: "HARD", rating: "~1600" },
    { level: 10, label: "MASTER", rating: "~2000" },
];

export function AILevelSelector({
    selectedLevel,
    onSelect,
}: AILevelSelectorProps) {
    return (
        <div className="mb-6 md:mb-8">
            <h3 className="font-display text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                AI DIFFICULTY
            </h3>
            <div className="flex flex-wrap gap-2 md:gap-3">
                {aiLevels.map((ai) => (
                    <button
                        key={ai.level}
                        onClick={() => onSelect(ai.level)}
                        className={`px-3 md:px-4 py-2 md:py-3 border rounded transition-all text-sm md:text-base ${selectedLevel === ai.level
                            ? "border-accent bg-accent/10 text-white"
                            : "border-border text-foreground-muted hover:border-accent/50"
                            }`}
                    >
                        <div className="font-semibold">{ai.label}</div>
                        <div className="text-xs opacity-70">{ai.rating}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
