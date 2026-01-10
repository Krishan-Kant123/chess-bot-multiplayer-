"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

interface VictoryScreenProps {
    reason: string;
    moveCount: number;
    roomId: string;
}

export function VictoryScreen({ reason, moveCount, roomId }: VictoryScreenProps) {
    const router = useRouter();

    return (
        <div className="w-full h-full bg-accent flex items-center justify-center corner-brackets">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
            >
                <h1 className="font-display text-9xl text-white mb-4">VICTORY</h1>
                <p className="text-white/80 uppercase tracking-widest mb-2 text-xl">
                    {reason.replace(/_/g, " ")}
                </p>
                <p className="text-white/60 uppercase tracking-widest mb-8">
                    {moveCount} MOVES
                </p>
                <div className="flex gap-4 justify-center">
                    <Button className="bg-black hover:bg-gray-900" size="lg" onClick={() => router.push(`/analysis/${roomId}`)}>
                        <Crown className="w-5 h-5" />
                        ANALYSIS
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-white text-white hover:bg-white/10"
                        onClick={() => router.push("/dashboard")}
                    >
                        LOBBY
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
