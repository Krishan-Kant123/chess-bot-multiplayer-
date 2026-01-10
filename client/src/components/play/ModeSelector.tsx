"use client";

import { Card } from "@/components/ui/card";
import { Swords, Users, Bot, LucideIcon } from "lucide-react";

interface Mode {
    mode: "quick" | "friend" | "ai";
    icon: LucideIcon;
    title: string;
    desc: string;
}

interface ModeSelectorProps {
    selectedMode: "quick" | "friend" | "ai" | null;
    onSelect: (mode: "quick" | "friend" | "ai") => void;
}

const modes: Mode[] = [
    {
        mode: "quick",
        icon: Swords,
        title: "QUICK MATCH",
        desc: "Find an opponent instantly",
    },
    {
        mode: "friend",
        icon: Users,
        title: "PLAY FRIEND",
        desc: "Create or join private room",
    },
    {
        mode: "ai",
        icon: Bot,
        title: "VS COMPUTER",
        desc: "Train against Stockfish AI",
    },
];

export function ModeSelector({ selectedMode, onSelect }: ModeSelectorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {modes.map((item, index) => (
                <Card
                    key={item.mode}
                    className={`p-4 md:p-6 cursor-pointer transition-all duration-300 hover:border-accent/50 ${selectedMode === item.mode ? "border-accent shadow-glow-red" : ""
                        }`}
                    onClick={() => onSelect(item.mode)}
                >
                    <item.icon
                        className={`w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 ${selectedMode === item.mode ? "text-accent" : "text-foreground-muted"
                            }`}
                    />
                    <h3 className="font-display text-lg md:text-2xl mb-1 md:mb-2">{item.title}</h3>
                    <p className="text-foreground-dim text-xs md:text-sm">{item.desc}</p>
                </Card>
            ))}
        </div>
    );
}
