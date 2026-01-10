"use client";

import { motion, AnimatePresence } from "framer-motion";
import { VictoryScreen } from "./VictoryScreen";
import { DefeatScreen } from "./DefeatScreen";
import { DrawScreen } from "./DrawScreen";

interface GameResult {
    winner: string;
    reason: string;
}

interface GameResultModalProps {
    gameResult: GameResult | null;
    playerColor: "white" | "black";
    moveCount: number;
    roomId: string;
}

export function GameResultModal({
    gameResult,
    playerColor,
    moveCount,
    roomId,
}: GameResultModalProps) {
    if (!gameResult) return null;

    const isVictory = gameResult.winner === playerColor;
    const isDraw = gameResult.winner === "draw";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50"
            >
                {isVictory ? (
                    <VictoryScreen reason={gameResult.reason} moveCount={moveCount} roomId={roomId} />
                ) : isDraw ? (
                    <DrawScreen reason={gameResult.reason} />
                ) : (
                    <DefeatScreen reason={gameResult.reason} roomId={roomId} />
                )}
            </motion.div>
        </AnimatePresence>
    );
}
