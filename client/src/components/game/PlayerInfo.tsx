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
        <div className="w-full max-w-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-semibold text-white">{name}</div>
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
                    "font-mono text-2xl px-4 py-2 rounded",
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
