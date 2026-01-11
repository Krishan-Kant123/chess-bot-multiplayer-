"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatTime, cn } from "@/lib/utils";

interface PlayerInfoProps {
    name: string;
    time: number | null;
    color: "white" | "black";
    isMyTurn: boolean;
    isActive: boolean;
    disconnected?: boolean;
    showColor?: boolean;
}

export function PlayerInfo({
    name,
    time,
    color,
    isMyTurn,
    isActive,
    disconnected = false,
    showColor = false,
}: PlayerInfoProps) {
    return (
        <div className="w-full max-w-lg flex items-center justify-between px-2 md:px-0">
            <div className="flex items-center gap-2 md:gap-3">
                <Avatar className="w-8 h-8 md:w-10 md:h-10">
                    <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-semibold text-white text-sm md:text-base truncate max-w-[120px] md:max-w-none">{name}</div>
                    {disconnected && (
                        <div className="text-xs text-accent">Disconnected</div>
                    )}
                    {showColor && (
                        <div className="text-xs text-foreground-muted">
                            {color.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
            <div
                className={cn(
                    "font-mono text-lg md:text-2xl px-2 md:px-4 py-1 md:py-2 rounded",
                    isMyTurn && isActive
                        ? "bg-accent text-white animate-pulse"
                        : "bg-background-elevated text-foreground-muted"
                )}
            >
                {time !== null ? formatTime(time) : "--:--"}
            </div>
        </div>
    );
}
