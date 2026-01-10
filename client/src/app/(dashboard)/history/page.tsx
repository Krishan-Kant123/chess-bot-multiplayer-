"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { roomsApi, Match } from "@/lib/api";
import { formatTimeAgo, getRatingChangeColor, formatRating } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
    Filter,
    Download,
    Eye,
    Zap,
    Clock,
    Timer,
    TrendingUp,
    TrendingDown,
    Crown,
    Trophy,
    Target,
} from "lucide-react";

export default function HistoryPage() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<Match[]>([]);
    const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [resultFilter, setResultFilter] = useState<"all" | "win" | "loss" | "draw">("all");
    const [timeControlFilter, setTimeControlFilter] = useState<"all" | "bullet" | "blitz" | "rapid">("all");

    useEffect(() => {
        fetchMatches();
    }, [page]);

    useEffect(() => {
        applyFilters();
    }, [matches, resultFilter, timeControlFilter]);

    const fetchMatches = async () => {
        setIsLoading(true);
        const { data } = await roomsApi.getHistory(page, 10);
        if (data) {
            setMatches(data.matches);
            setTotalPages(data.pagination.pages);
        }
        setIsLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...matches];

        // Filter by result
        if (resultFilter !== "all") {
            filtered = filtered.filter(m => m.result === resultFilter);
        }

        // Filter by time control
        if (timeControlFilter !== "all") {
            filtered = filtered.filter(m => {
                const timeControl = m.timeControl || 0;
                if (timeControlFilter === "bullet") return timeControl <= 180;
                if (timeControlFilter === "blitz") return timeControl > 180 && timeControl <= 600;
                if (timeControlFilter === "rapid") return timeControl > 600;
                return true;
            });
        }

        setFilteredMatches(filtered);
    };

    // Calculate stats
    const totalGames = user?.gamesPlayed || 0;
    const wins = user?.wins || 0;
    const losses = user?.losses || 0;
    const draws = user?.draws || 0;
    const winStreak = matches.filter((m) => m.result === "win").length; // Simplified

    return (
        <div className="p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
                <div>
                    <h1 className="font-display text-3xl md:text-5xl mb-2">COMBAT LOG</h1>
                    <p className="text-xs tracking-widest text-accent">
                        ARCHIVE_V.04 // CLASSIFIED // READ-ONLY ACCESS
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={showFilters ? "default" : "secondary"}
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="icon">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                >
                    <Card className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Result Filter */}
                            <div>
                                <label className="text-sm font-semibold text-foreground-muted mb-2 block">
                                    RESULT
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {["all", "win", "loss", "draw"].map((filter) => (
                                        <Button
                                            key={filter}
                                            variant={resultFilter === filter ? "default" : "secondary"}
                                            size="sm"
                                            onClick={() => setResultFilter(filter as typeof resultFilter)}
                                        >
                                            {filter.toUpperCase()}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Control Filter */}
                            <div>
                                <label className="text-sm font-semibold text-foreground-muted mb-2 block">
                                    TIME CONTROL
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {["all", "bullet", "blitz", "rapid"].map((filter) => (
                                        <Button
                                            key={filter}
                                            variant={timeControlFilter === filter ? "default" : "secondary"}
                                            size="sm"
                                            onClick={() => setTimeControlFilter(filter as typeof timeControlFilter)}
                                        >
                                            {filter.toUpperCase()}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Filter Stats */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm text-foreground-muted">
                                Showing <span className="text-accent font-semibold">{filteredMatches.length}</span> of <span className="font-semibold">{matches.length}</span> matches
                            </p>
                        </div>
                    </Card>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                {/* Match Table */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-border text-left text-xs text-foreground-dim uppercase tracking-wider">
                                        <th className="p-3 md:p-4">RESULT</th>
                                        <th className="p-3 md:p-4">OPPONENT</th>
                                        <th className="p-3 md:p-4">ELO Δ</th>
                                        <th className="p-3 md:p-4 hidden sm:table-cell">ACCURACY %</th>
                                        <th className="p-3 md:p-4 hidden md:table-cell">TIMESTAMP</th>
                                        <th className="p-3 md:p-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMatches.map((match) => (
                                        <motion.tr
                                            key={match._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="combat-log-row"
                                        >
                                            <td className="p-3 md:p-4">
                                                <span className={`px-2 md:px-3 py-1 rounded text-xs font-bold uppercase ${match.result === "win"
                                                    ? "bg-success/10 text-success border border-success/30"
                                                    : match.result === "loss"
                                                        ? "bg-accent/10 text-accent border border-accent/30"
                                                        : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                                                    }`}>
                                                    {match.result}
                                                </span>
                                            </td>
                                            <td className="p-3 md:p-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <Avatar className="w-6 h-6 md:w-8 md:h-8">
                                                        <AvatarFallback className="text-xs">
                                                            {match.opponentId?.username?.slice(0, 2).toUpperCase() || "AI"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-white font-medium text-sm md:text-base truncate max-w-[100px] md:max-w-none">
                                                        {match.opponentId?.username || "Stockfish AI"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 md:p-4">
                                                <span className={`font-mono font-bold text-sm md:text-base ${getRatingChangeColor(match.ratingChange)}`}>
                                                    {match.ratingChange > 0 ? "+" : ""}{match.ratingChange}
                                                </span>
                                            </td>
                                            <td className="p-3 md:p-4 text-foreground-muted hidden sm:table-cell">
                                                {/* Placeholder - would need engine analysis */}
                                                {Math.floor(70 + Math.random() * 25)}%
                                            </td>
                                            <td className="p-3 md:p-4 text-foreground-dim text-sm hidden md:table-cell">
                                                {formatTimeAgo(match.createdAt)}
                                            </td>
                                            <td className="p-3 md:p-4">
                                                <Link href={`/analysis/${match._id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-border flex items-center justify-center gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    size="sm"
                                >
                                    Previous
                                </Button>
                                <span className="text-foreground-muted text-sm">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    size="sm"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* View Full Archive */}
                    <div className="text-center mt-4 hidden md:block">
                        <Button variant="ghost" className="text-foreground-dim">
                            VIEW FULL ARCHIVE ↓
                        </Button>
                    </div>

                    {/* Deep Metrics */}
                    <div className="mt-6 md:mt-8 hidden lg:block">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-accent" />
                            <h2 className="font-display text-xl md:text-2xl">DEEP METRICS</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Avg Move Time */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs text-foreground-dim uppercase tracking-wider">
                                        AVG MOVE TIME (SEC)
                                    </span>
                                    <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                                        LIVE
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-mono text-4xl text-white">14.2s</span>
                                    <span className="text-sm text-success">-2.1% Faster</span>
                                </div>
                                {/* Mini chart placeholder */}
                                <div className="flex items-end gap-1 mt-4 h-16">
                                    {[4, 6, 5, 8, 3, 7, 9, 5].map((h, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 ${i === 7 ? "bg-accent" : "bg-accent/30"}`}
                                            style={{ height: `${h * 10}%` }}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] text-foreground-dim mt-2">
                                    <span>OPENING</span>
                                    <span>MIDGAME</span>
                                    <span>ENDGAME</span>
                                    <span>TACTICAL</span>
                                    <span>BLUNDERS</span>
                                </div>
                            </Card>

                            {/* ELO Volatility */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs text-foreground-dim uppercase tracking-wider">
                                        ELO VOLATILITY
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-mono text-4xl text-white">{user?.rating || 1200}</span>
                                    <span className="text-sm text-success">+45 This Month</span>
                                </div>
                                {/* Line chart placeholder */}
                                <div className="mt-4 h-16 relative">
                                    <svg className="w-full h-full" preserveAspectRatio="none">
                                        <polyline
                                            points="0,60 50,50 100,55 150,40 200,35 250,45 300,30 350,25"
                                            fill="none"
                                            stroke="rgba(255,255,255,0.3)"
                                            strokeWidth="2"
                                        />
                                        <circle cx="350" cy="25" r="4" fill="#dc2626" />
                                    </svg>
                                </div>
                                <div className="flex justify-between text-[10px] text-foreground-dim mt-2">
                                    <span>WEEK 1</span>
                                    <span>WEEK 2</span>
                                    <span>WEEK 3</span>
                                    <span>WEEK 4</span>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4 order-1 lg:order-2">
                    {/* Performance Snapshot */}
                    <Card className="p-4">
                        <h3 className="font-display text-base md:text-lg mb-4">PERFORMANCE SNAPSHOT</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-foreground-dim">CURRENT STREAK</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-4xl md:text-5xl text-white">{winStreak}</span>
                                <span className="text-success font-semibold">WIN</span>
                            </div>

                            <div className="border-t border-border pt-4">
                                <span className="text-xs text-foreground-dim">BEST WIN</span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="font-mono text-2xl md:text-3xl text-white">{user?.rating || 1200}</span>
                                    <span className="text-foreground-muted">ELO</span>
                                </div>
                            </div>

                            <div className="border-t border-border pt-4">
                                <span className="text-xs text-foreground-dim">TOTAL GAMES</span>
                                <div className="font-mono text-2xl md:text-3xl text-white mt-1">
                                    {totalGames.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Alerts */}
                    <Card className="p-4 hidden md:block">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg">ALERTS</h3>
                            <span className="bg-accent text-white text-xs px-2 py-0.5 rounded">
                                3 NEW
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center">
                                    <TrendingDown className="w-3 h-3 text-accent" />
                                </div>
                                <div>
                                    <div className="text-white">REVIEW: BLUNDER IN MOVE 24 VS. ROOK_SLAYER</div>
                                    <div className="text-foreground-dim text-xs">12 MIN AGO</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-6 h-6 rounded bg-success/20 flex items-center justify-center">
                                    <Trophy className="w-3 h-3 text-success" />
                                </div>
                                <div>
                                    <div className="text-white">ACHIEVEMENT UNLOCKED: "TACTICIAN V"</div>
                                    <div className="text-foreground-dim text-xs">2 HOURS AGO</div>
                                </div>
                            </div>
                        </div>

                        <Button variant="secondary" className="w-full mt-4" size="sm">
                            CLEAR ALL
                        </Button>
                    </Card>

                    {/* Pro Feature */}
                    <Card className="p-4 bg-background-elevated hidden md:block">
                        <span className="text-[10px] text-foreground-dim uppercase tracking-widest">
                            PRO FEATURE
                        </span>
                        <h4 className="font-display text-lg md:text-xl mt-2 mb-4">
                            UNLOCK ENGINE ANALYSIS DEPTH 50
                        </h4>
                        <Button variant="outline" size="sm">
                            UPGRADE
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 md:mt-16 pt-8 border-t border-border hidden md:block">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h4 className="font-display text-xl">ELITE CHESS SYSTEMS</h4>
                        <p className="text-foreground-dim text-sm mt-1">
                            Forged in strategy. Built for the elite. Analyze, Adapt, Dominate.
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <h5 className="text-xs text-foreground-dim mb-2">PLATFORM</h5>
                            <ul className="text-sm space-y-1">
                                <li className="text-foreground-muted hover:text-white cursor-pointer">DOWNLOAD APP</li>
                                <li className="text-foreground-muted hover:text-white cursor-pointer">API ACCESS</li>
                                <li className="text-foreground-muted hover:text-white cursor-pointer">SERVER STATUS</li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-xs text-foreground-dim mb-2">LEGAL</h5>
                            <ul className="text-sm space-y-1">
                                <li className="text-foreground-muted hover:text-white cursor-pointer">PRIVACY PROTOCOL</li>
                                <li className="text-foreground-muted hover:text-white cursor-pointer">TERMS OF COMBAT</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
