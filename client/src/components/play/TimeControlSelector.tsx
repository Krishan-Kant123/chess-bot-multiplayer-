"use client";

import { Clock, Zap, Timer, Crown, LucideIcon } from "lucide-react";

interface TimeControl {
    label: string;
    time: number;
    icon: LucideIcon;
    description: string;
}

interface TimeControlSelectorProps {
    selectedTime: number;
    onSelect: (time: number) => void;
}

const timeControls: TimeControl[] = [
    { label: "BULLET", time: 60, icon: Zap, description: "1 min" },
    { label: "BULLET", time: 180, icon: Zap, description: "3 min" },
    { label: "BLITZ", time: 300, icon: Clock, description: "5 min" },
    { label: "BLITZ", time: 600, icon: Clock, description: "10 min" },
    { label: "RAPID", time: 900, icon: Timer, description: "15 min" },
    { label: "RAPID", time: 1800, icon: Timer, description: "30 min" },
    { label: "UNLIMITED", time: -1, icon: Crown, description: "∞" },
];

export function TimeControlSelector({
    selectedTime,
    onSelect,
}: TimeControlSelectorProps) {
    return (
        <div className="mb-6 md:mb-8">
            <h3 className="font-display text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                TIME CONTROL
            </h3>
            <div className="flex flex-wrap gap-2 md:gap-3">
                {timeControls.map((tc) => (
                    <button
                        key={tc.time}
                        onClick={() => onSelect(tc.time)}
                        className={`px-3 md:px-4 py-2 md:py-3 border rounded transition-all text-sm md:text-base ${selectedTime === tc.time
                            ? "border-accent bg-accent/10 text-white"
                            : "border-border text-foreground-muted hover:border-accent/50"
                            }`}
                    >
                        <tc.icon className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                        <span className="font-mono">{tc.description}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
