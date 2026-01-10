"use client";

import { Card } from "@/components/ui/card";
import { formatTime, getRatingChangeColor } from "@/lib/utils";
import type { Match } from "@/lib/api";

interface GameInfoCardProps {
    match: Match;
}

export function GameInfoCard({ match }: GameInfoCardProps) {
    return (
        <Card className="p-4">
            <h3 className="font-display text-lg mb-4">GAME INFO</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-foreground-dim">Result</span>
                    <span
                        className={
                            match.result === "win"
                                ? "text-success"
                                : match.result === "loss"
                                    ? "text-accent"
                                    : "text-foreground-muted"
                        }
                    >
                        {match.result.toUpperCase()}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-foreground-dim">End Reason</span>
                    <span className="text-white capitalize">
                        {match.endReason.replace(/_/g, " ")}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-foreground-dim">Your Color</span>
                    <span className="text-white capitalize">{match.userColor}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-foreground-dim">Time Control</span>
                    <span className="text-white font-mono">
                        {formatTime(match.timeControl)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-foreground-dim">Rating Change</span>
                    <span className={getRatingChangeColor(match.ratingChange)}>
                        {match.ratingChange > 0 ? "+" : ""}
                        {match.ratingChange}
                    </span>
                </div>
            </div>
        </Card>
    );
}
