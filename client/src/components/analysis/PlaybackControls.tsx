"use client";

import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    SkipBack,
    SkipForward,
    Play,
    Pause,
} from "lucide-react";

interface PlaybackControlsProps {
    isPlaying: boolean;
    currentMove: number;
    totalMoves: number;
    onPlay: () => void;
    onPause: () => void;
    onPrev: () => void;
    onNext: () => void;
    onStart: () => void;
    onEnd: () => void;
}

export function PlaybackControls({
    isPlaying,
    currentMove,
    totalMoves,
    onPlay,
    onPause,
    onPrev,
    onNext,
    onStart,
    onEnd,
}: PlaybackControlsProps) {
    return (
        <div className="mt-6">
            <div className="flex items-center justify-center gap-2">
                <Button variant="ghost" size="icon" onClick={onStart}>
                    <SkipBack className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onPrev}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                    size="icon"
                    onClick={isPlaying ? onPause : onPlay}
                    className={isPlaying ? "bg-accent" : ""}
                >
                    {isPlaying ? (
                        <Pause className="w-5 h-5" />
                    ) : (
                        <Play className="w-5 h-5" />
                    )}
                </Button>
                <Button variant="ghost" size="icon" onClick={onNext}>
                    <ChevronRight className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onEnd}>
                    <SkipForward className="w-5 h-5" />
                </Button>
            </div>

            <div className="mt-4 px-8">
                <div className="h-1 bg-background-elevated rounded-full">
                    <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{
                            width: `${((currentMove + 1) / totalMoves) * 100}%`,
                        }}
                    />
                </div>
                <div className="flex justify-between text-xs text-foreground-dim mt-2">
                    <span>Move {currentMove + 1}</span>
                    <span>{totalMoves} total</span>
                </div>
            </div>
        </div>
    );
}
