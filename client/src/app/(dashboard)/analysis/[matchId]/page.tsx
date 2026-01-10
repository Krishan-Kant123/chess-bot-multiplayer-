"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@/components/ui/button";
import { roomsApi, Match } from "@/lib/api";
import { getRatingChangeColor } from "@/lib/utils";
import { PlaybackControls } from "@/components/analysis/PlaybackControls";
import { GameInfoCard } from "@/components/analysis/GameInfoCard";
import { AnalysisMoveList } from "@/components/analysis/AnalysisMoveList";
import { RotateCcw, Download, Share2 } from "lucide-react";

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const matchId = params.matchId as string;

    const [match, setMatch] = useState<Match | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [game, setGame] = useState(new Chess());
    const [positions, setPositions] = useState<string[]>([]);

    useEffect(() => {
        const fetchMatch = async () => {
            const { data } = await roomsApi.getMatch(matchId);
            if (data?.match) {
                setMatch(data.match);

                const tempGame = new Chess();
                const positionsArray = [tempGame.fen()];

                if (data.match.gameData.moves && data.match.gameData.moves.length > 0) {
                    for (const move of data.match.gameData.moves) {
                        try {
                            tempGame.move({ from: move.from, to: move.to, promotion: "q" });
                            positionsArray.push(tempGame.fen());
                        } catch (e) {
                            console.error("Invalid move:", move);
                        }
                    }
                } else if (data.match.gameData.pgn) {
                    tempGame.loadPgn(data.match.gameData.pgn);
                    const history = tempGame.history({ verbose: true });
                    tempGame.reset();
                    for (const move of history) {
                        tempGame.move(move);
                        positionsArray.push(tempGame.fen());
                    }
                }

                setPositions(positionsArray);
            }
            setIsLoading(false);
        };

        fetchMatch();
    }, [matchId]);

    useEffect(() => {
        if (positions.length > 0) {
            const posIndex = currentMoveIndex < 0 ? 0 : currentMoveIndex + 1;
            if (posIndex < positions.length) {
                const newGame = new Chess(positions[posIndex]);
                setGame(newGame);
            }
        }
    }, [currentMoveIndex, positions]);

    useEffect(() => {
        if (isPlaying && match) {
            const moveCount = match.gameData.moves?.length || match.gameData.moveCount;
            if (currentMoveIndex < moveCount - 1) {
                const timer = setTimeout(() => {
                    setCurrentMoveIndex((prev) => prev + 1);
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                setIsPlaying(false);
            }
        }
    }, [isPlaying, currentMoveIndex, match]);

    const goToStart = () => setCurrentMoveIndex(-1);
    const goToEnd = () => {
        const moveCount = match?.gameData.moves?.length || match?.gameData.moveCount || 0;
        setCurrentMoveIndex(moveCount - 1);
    };
    const prevMove = () => setCurrentMoveIndex((prev) => Math.max(-1, prev - 1));
    const nextMove = () => {
        const moveCount = match?.gameData.moves?.length || match?.gameData.moveCount || 0;
        setCurrentMoveIndex((prev) => Math.min(moveCount - 1, prev + 1));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!match) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="font-display text-4xl mb-4">MATCH NOT FOUND</h1>
                    <Button onClick={() => router.push("/history")}>BACK TO HISTORY</Button>
                </div>
            </div>
        );
    }

    const moves = match.gameData.moves || [];
    const moveCount = moves.length || match.gameData.moveCount;

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-8 bg-accent" />
                    <h1 className="font-display text-4xl">GAME ANALYSIS</h1>
                </div>
                <div className="flex items-center gap-4 text-foreground-muted">
                    <span>vs {match.opponentId?.username || "Stockfish AI"}</span>
                    <span>•</span>
                    <span
                        className={
                            match.result === "win"
                                ? "text-success"
                                : match.result === "loss"
                                    ? "text-accent"
                                    : ""
                        }
                    >
                        {match.result.toUpperCase()}
                    </span>
                    <span>•</span>
                    <span>{moveCount} moves</span>
                    <span>•</span>
                    <span className={getRatingChangeColor(match.ratingChange)}>
                        {match.ratingChange > 0 ? "+" : ""}
                        {match.ratingChange} ELO
                    </span>
                </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-8">
                {/* Chessboard */}
                <div className="col-span-2">
                    <div className="flex justify-center">
                        <Chessboard
                            position={game.fen()}
                            boardOrientation={match.userColor}
                            boardWidth={560}
                            arePiecesDraggable={false}
                            customBoardStyle={{
                                borderRadius: "4px",
                                boxShadow: "0 0 30px rgba(0,0,0,0.5)",
                            }}
                            customDarkSquareStyle={{ backgroundColor: "#1a1a1a" }}
                            customLightSquareStyle={{ backgroundColor: "#2a2a2a" }}
                        />
                    </div>

                    {/* Playback Controls */}
                    <PlaybackControls
                        isPlaying={isPlaying}
                        currentMove={currentMoveIndex}
                        totalMoves={moveCount}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onPrev={prevMove}
                        onNext={nextMove}
                        onStart={goToStart}
                        onEnd={goToEnd}
                    />
                </div>

                {/* Move List & Info */}
                <div className="space-y-4">
                    <GameInfoCard match={match} />
                    <AnalysisMoveList
                        moves={moves}
                        currentMoveIndex={currentMoveIndex}
                        onMoveClick={setCurrentMoveIndex}
                    />

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button variant="secondary" className="flex-1">
                            <RotateCcw className="w-4 h-4" />
                            REMATCH
                        </Button>
                        <Button variant="secondary" size="icon">
                            <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="icon">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
