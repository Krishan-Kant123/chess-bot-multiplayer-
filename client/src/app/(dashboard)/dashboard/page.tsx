"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { roomsApi, Match } from "@/lib/api";
import { VictoryBanner } from "@/components/dashboard/VictoryBanner";
import { CombatLogPreview } from "@/components/dashboard/CombatLogPreview";
import { Crown } from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuth();
    const [recentMatches, setRecentMatches] = useState<Match[]>([]);
    const [lastMatch, setLastMatch] = useState<Match | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await roomsApi.getHistory(1, 5);
            if (data?.matches) {
                setRecentMatches(data.matches);
                setLastMatch(data.matches[0] || null);
            }
            setIsLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div className="p-4 md:p-8">
            {/* Last Match Banner */}
            {lastMatch && <VictoryBanner match={lastMatch} />}

            {/* Welcome banner for new users */}
            {!lastMatch && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-accent to-accent-dark rounded-lg p-6 md:p-8 mb-6 md:mb-8 text-center"
                >
                    <Crown className="w-12 h-12 md:w-16 md:h-16 text-white mx-auto mb-4" />
                    <h2 className="font-display text-2xl md:text-4xl text-white mb-2">
                        WELCOME, {user?.username?.toUpperCase()}
                    </h2>
                    <p className="text-sm md:text-base text-white/80 mb-6">
                        Ready to begin your journey to grandmaster?
                    </p>
                    <Link href="/play">
                        <Button className="bg-black hover:bg-gray-900" size="lg">
                            START YOUR FIRST GAME
                        </Button>
                    </Link>
                </motion.div>
            )}

            {/* Combat Log (Full Width) */}
            <div className="grid grid-cols-1">
                <CombatLogPreview matches={recentMatches} />
            </div>
        </div>
    );
}
