"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import socketService from "@/lib/socket";
import { ModeSelector } from "@/components/play/ModeSelector";
import { TimeControlSelector } from "@/components/play/TimeControlSelector";
import { AILevelSelector } from "@/components/play/AILevelSelector";
import { PrivateRoomManager } from "@/components/play/PrivateRoomManager";
import { ColorSelector } from "@/components/play/ColorSelector";
import { Swords, Bot, X } from "lucide-react";

type ColorChoice = "white" | "black" | "random";

export default function PlayPage() {
    const router = useRouter();
    const { isGuest } = useAuth();

    const [selectedMode, setSelectedMode] = useState<"quick" | "friend" | "ai" | null>(null);
    const [selectedTime, setSelectedTime] = useState(600);
    const [matchType, setMatchType] = useState<"casual" | "rated">("casual");
    const [aiLevel, setAiLevel] = useState(5);
    const [preferredColor, setPreferredColor] = useState<ColorChoice>("random");
    const [isSearching, setIsSearching] = useState(false);
    const [createdRoomCode, setCreatedRoomCode] = useState("");

    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket) return;

        const unsubMatch = socketService.onMatchFound((data) => {
            console.log("Match found, redirecting to game");
            setIsSearching(false);
            router.push(`/game/${data.roomId}`);
        });

        const unsubRoomCreated = socketService.onRoomCreated((data) => {
            console.log("Room created:", data.room.roomId);
            setCreatedRoomCode(data.room.roomId);
            if (data.room.matchType === "ai") {
                router.push(`/game/${data.room.roomId}`);
            }
        });

        const unsubGameStarted = socketService.onGameStarted((data) => {
            console.log("Game started, redirecting to game");
            router.push(`/game/${data.room.roomId}`);
        });

        // Listen for room updates - this fires when player 2 joins
        const unsubRoomUpdate = socketService.onRoomUpdate((data) => {
            console.log("Room update received on play page:", data.room);
            // If we just joined as player 2 and game is starting, redirect
            if (data.room.gameStatus === "in_progress" || data.room.gameStatus === "waiting") {
                console.log("Redirecting to game room:", data.room.roomId);
                router.push(`/game/${data.room.roomId}`);
            }
        });

        return () => {
            unsubMatch();
            unsubRoomCreated();
            unsubGameStarted();
            unsubRoomUpdate();
        };
    }, [router]);

    const handleQuickMatch = () => {
        if (isGuest && matchType === "rated") return;
        setIsSearching(true);
        socketService.joinQueue({
            matchType,
            timeControl: selectedTime,
            preferredColor,
        });
    };

    const handleCancelSearch = () => {
        setIsSearching(false);
        socketService.leaveQueue();
    };

    const handleCreatePrivateRoom = () => {
        socketService.createRoom({
            timeControl: selectedTime,
            matchType: isGuest ? "casual" : matchType,
            isPrivate: true,
            preferredColor,
        });
    };

    const handleJoinRoom = (roomId: string) => {
        if (roomId.trim()) {
            socketService.joinRoomAsPlayer(roomId.trim());
        }
    };

    const handlePlayAI = () => {
        console.log("Creating AI game with color:", preferredColor);
        socketService.createRoom({
            timeControl: selectedTime,
            matchType: "ai",
            aiLevel,
            preferredColor,
        });
    };

    return (
        <div className="p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 md:mb-8"
            >
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-6 md:h-8 bg-accent" />
                    <h1 className="font-display text-2xl md:text-4xl">SELECT OPERATION</h1>
                </div>
                <p className="text-foreground-muted ml-3 text-sm md:text-base">Choose your battle mode</p>
            </motion.div>

            {/* Mode Selection */}
            <ModeSelector selectedMode={selectedMode} onSelect={setSelectedMode} />

            {/* Configuration */}
            <AnimatePresence>
                {selectedMode && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Color Selection */}
                        <ColorSelector
                            selectedColor={preferredColor}
                            onSelect={setPreferredColor}
                        />

                        <TimeControlSelector
                            selectedTime={selectedTime}
                            onSelect={setSelectedTime}
                        />

                        {/* Match Type */}
                        {selectedMode !== "ai" && (
                            <div className="mb-6 md:mb-8">
                                <h3 className="font-display text-lg md:text-xl mb-4">MATCH TYPE</h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setMatchType("casual")}
                                        className={`flex-1 px-4 md:px-6 py-3 border rounded transition-all text-sm md:text-base ${matchType === "casual"
                                            ? "border-accent bg-accent/10 text-white"
                                            : "border-border text-foreground-muted hover:border-accent/50"
                                            }`}
                                    >
                                        CASUAL
                                    </button>
                                    <button
                                        onClick={() => !isGuest && setMatchType("rated")}
                                        disabled={isGuest}
                                        className={`flex-1 px-4 md:px-6 py-3 border rounded transition-all text-sm md:text-base ${matchType === "rated"
                                            ? "border-accent bg-accent/10 text-white"
                                            : "border-border text-foreground-muted hover:border-accent/50"
                                            } ${isGuest ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        RATED
                                        {isGuest && <span className="text-xs ml-2 block sm:inline">(LOGIN REQUIRED)</span>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* AI Level */}
                        {selectedMode === "ai" && (
                            <AILevelSelector selectedLevel={aiLevel} onSelect={setAiLevel} />
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {selectedMode === "quick" && (
                                <>
                                    {isSearching ? (
                                        <Button onClick={handleCancelSearch} variant="destructive" size="lg" className="w-full sm:w-auto">
                                            <X className="w-5 h-5" />
                                            CANCEL SEARCH
                                        </Button>
                                    ) : (
                                        <Button onClick={handleQuickMatch} size="lg" className="animate-pulse-glow w-full sm:w-auto">
                                            <Swords className="w-5 h-5" />
                                            FIND MATCH
                                        </Button>
                                    )}
                                    {isSearching && (
                                        <div className="flex items-center justify-center sm:justify-start gap-3 text-foreground-muted text-sm md:text-base">
                                            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                            Searching for opponent...
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedMode === "friend" && (
                                <PrivateRoomManager
                                    createdRoomCode={createdRoomCode}
                                    onCreateRoom={handleCreatePrivateRoom}
                                    onJoinRoom={handleJoinRoom}
                                />
                            )}

                            {selectedMode === "ai" && (
                                <Button onClick={handlePlayAI} size="lg" className="animate-pulse-glow w-full sm:w-auto">
                                    <Bot className="w-5 h-5" />
                                    START AI GAME
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
