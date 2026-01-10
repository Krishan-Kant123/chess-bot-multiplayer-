"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatTimeAgo, getRatingChangeColor } from "@/lib/utils";
import { Eye, Zap, Clock, ChevronRight } from "lucide-react";
import type { Match } from "@/lib/api";

interface CombatLogPreviewProps {
    matches: Match[];
}

export function CombatLogPreview({ matches }: CombatLogPreviewProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-2"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-accent" />
                    <h3 className="font-display text-xl">COMBAT LOG</h3>
                </div>
                <Link
                    href="/history"
                    className="text-accent text-sm hover:underline flex items-center gap-1"
                >
                    VIEW FULL HISTORY
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            <Card className="overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border text-left text-xs text-foreground-dim uppercase tracking-wider">
                            <th className="p-4">RES</th>
                            <th className="p-4">OPPONENT</th>
                            <th className="p-4">MODE</th>
                            <th className="p-4">DATE</th>
                            <th className="p-4">RATING</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {matches.map((match) => (
                            <tr key={match._id} className="combat-log-row">
                                <td className="p-4">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-bold ${match.result === "win"
                                                ? "bg-success/20 text-success"
                                                : match.result === "loss"
                                                    ? "bg-accent/20 text-accent"
                                                    : "bg-gray-500/20 text-gray-400"
                                            }`}
                                    >
                                        {match.result === "win"
                                            ? "W"
                                            : match.result === "loss"
                                                ? "L"
                                                : "D"}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs">
                                                {match.opponentId?.username?.slice(0, 2).toUpperCase() ||
                                                    "??"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-white">
                                            {match.opponentId?.username || "Unknown"}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="flex items-center gap-1 text-foreground-muted text-sm">
                                        {match.timeControl <= 180 ? (
                                            <>
                                                <Zap className="w-3 h-3" /> BULLET
                                            </>
                                        ) : match.timeControl <= 600 ? (
                                            <>
                                                <Clock className="w-3 h-3" /> BLITZ
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-3 h-3" /> RAPID
                                            </>
                                        )}
                                    </span>
                                </td>
                                <td className="p-4 text-foreground-dim text-sm">
                                    {formatTimeAgo(match.createdAt)}
                                </td>
                                <td className="p-4">
                                    <span className="text-white font-mono">
                                        {match.ratingAfter}
                                    </span>
                                    <span
                                        className={`ml-2 text-sm ${getRatingChangeColor(
                                            match.ratingChange
                                        )}`}
                                    >
                                        ({match.ratingChange > 0 ? "+" : ""}
                                        {match.ratingChange})
                                    </span>
                                </td>
                                <td className="p-4">
                                    <Link href={`/analysis/${match._id}`}>
                                        <button className="p-2 hover:bg-white/5 rounded transition-colors">
                                            <Eye className="w-4 h-4 text-foreground-dim" />
                                        </button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {matches.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-foreground-dim">
                                    No matches yet. Start your first game!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </motion.div>
    );
}
