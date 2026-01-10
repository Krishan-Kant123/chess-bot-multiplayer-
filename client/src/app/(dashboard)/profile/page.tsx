"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { roomsApi, Match } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Target, Clock, Zap } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<Match[]>([]);
    const [stats, setStats] = useState({
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        avgRating: 0,
    });

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await roomsApi.getHistory(1, 100);
            if (data?.matches) {
                setMatches(data.matches);
                calculateStats(data.matches);
            }
        };
        fetchData();
    }, []);

    const calculateStats = (matchesData: Match[]) => {
        const wins = matchesData.filter((m) => m.result === "win").length;
        const losses = matchesData.filter((m) => m.result === "loss").length;
        const draws = matchesData.filter((m) => m.result === "draw").length;
        const totalGames = matchesData.length;
        const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
        const avgRating =
            totalGames > 0
                ? matchesData.reduce((sum, m) => sum + (m.ratingAfter || user?.rating || 1200), 0) / totalGames
                : user?.rating || 1200;

        setStats({ totalGames, wins, losses, draws, winRate, avgRating });
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-foreground-muted">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 md:mb-8"
            >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                    <Avatar className="w-20 h-20 md:w-24 md:h-24">
                        <AvatarFallback className="text-2xl md:text-3xl">
                            {user.username?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left">
                        <h1 className="font-display text-3xl md:text-5xl mb-2">
                            {user.username?.toUpperCase()}
                        </h1>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-foreground-muted text-sm md:text-base">
                            <span>RATING: {user.rating || 1200}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>
                                {user.gamesPlayed || stats.totalGames} GAMES PLAYED
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-foreground-dim text-xs md:text-sm">WIN RATE</span>
                        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-success" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-white">
                        {stats.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-foreground-dim mt-1">
                        {stats.wins}W / {stats.losses}L / {stats.draws}D
                    </div>
                </Card>

                <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-foreground-dim text-xs md:text-sm">AVG RATING</span>
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-white">
                        {Math.round(stats.avgRating)}
                    </div>
                </Card>

                <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-foreground-dim text-xs md:text-sm">TOTAL GAMES</span>
                        <Target className="w-4 h-4 md:w-5 md:h-5 text-foreground-muted" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-white">
                        {stats.totalGames}
                    </div>
                </Card>

                <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-foreground-dim text-xs md:text-sm">PEAK RATING</span>
                        <Zap className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-white">
                        {user.rating || 1200}
                    </div>
                </Card>
            </div>

            {/* Performance Chart Placeholder */}
            <Card className="p-4 md:p-6 mb-6 md:mb-8 hidden md:block">
                <h3 className="font-display text-lg md:text-xl mb-4">RATING HISTORY</h3>
                <div className="h-64 flex items-center justify-center text-foreground-dim">
                    <div>
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Rating graph coming soon</p>
                    </div>
                </div>
            </Card>

            {/* Recent Activity */}
            <div>
                <h3 className="font-display text-lg md:text-xl mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 md:h-6 bg-accent" />
                    RECENT ACTIVITY
                </h3>
                <div className="space-y-2">
                    {matches.slice(0, 10).map((match) => (
                        <Card key={match._id} className="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                            <div className="flex items-center gap-3 md:gap-4">
                                <span
                                    className={`px-2 md:px-3 py-1 rounded text-xs font-bold ${match.result === "win"
                                        ? "bg-success/20 text-success"
                                        : match.result === "loss"
                                            ? "bg-accent/20 text-accent"
                                            : "bg-gray-500/20 text-gray-400"
                                        }`}
                                >
                                    {match.result.toUpperCase()}
                                </span>
                                <span className="text-white text-sm md:text-base">
                                    vs {match.opponentId?.username || "Opponent"}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-foreground-muted">
                                <span>{match.gameData.moveCount} moves</span>
                                <span
                                    className={
                                        match.ratingChange > 0 ? "text-success" : "text-accent"
                                    }
                                >
                                    {match.ratingChange > 0 ? "+" : ""}
                                    {match.ratingChange}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
