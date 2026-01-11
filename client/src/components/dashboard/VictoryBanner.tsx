"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getRatingChangeColor } from "@/lib/utils";
import { Microscope, RotateCcw } from "lucide-react";
import type { Match } from "@/lib/api";

interface VictoryBannerProps {
    match: Match;
}

export function VictoryBanner({ match }: VictoryBannerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg overflow-hidden mb-6 md:mb-8 ${match.result === "win"
                ? "bg-gradient-to-r from-accent/20 to-accent/5"
                : match.result === "loss"
                    ? "bg-gradient-to-r from-gray-900 to-background-secondary"
                    : "bg-gradient-to-r from-gray-800 to-background-secondary"
                }`}
        >
            <div className="flex flex-col md:flex-row items-center p-4 md:p-6">
                <div className="hidden md:flex w-48 h-36 bg-background-card rounded-lg items-center justify-center mr-0 md:mr-8 mb-4 md:mb-0">
                    <div className="text-6xl opacity-30">♚</div>
                </div>

                <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-xs text-accent uppercase tracking-widest">
                            POST-MATCH ANALYSIS AVAILABLE
                        </span>
                    </div>

                    <h2
                        className={`font-display text-3xl md:text-5xl mb-2 text-center md:text-left ${match.result === "win" ? "text-white" : "text-foreground-muted"
                            }`}
                    >
                        {match.result === "win"
                            ? "VICTORY"
                            : match.result === "loss"
                                ? "DEFEAT"
                                : "DRAW"}
                    </h2>

                    <p className="text-sm md:text-base text-foreground-muted mb-4 text-center md:text-left">
                        VS. {match.opponentId?.username?.toUpperCase() || "OPPONENT"}
                        <span className="mx-2">•</span>
                        <span className={getRatingChangeColor(match.ratingChange)}>
                            {match.ratingChange > 0 ? "+" : ""}
                            {match.ratingChange} ELO
                        </span>
                        <span className="mx-2">•</span>
                        {match.gameData.moveCount} MOVES
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        <Link href={`/analysis/${match._id}`} className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto">
                                <Microscope className="w-4 h-4" />
                                ANALYZE GAME
                            </Button>
                        </Link>
                        <Button variant="secondary" className="w-full sm:w-auto">
                            <RotateCcw className="w-4 h-4" />
                            REMATCH
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
