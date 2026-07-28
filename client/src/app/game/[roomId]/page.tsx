"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useAuth } from "@/context/AuthContext";
import socketService from "@/lib/socket";
import { soundManager } from "@/lib/sounds";
import { Room, Move } from "@/lib/api";
import { PlayerInfo } from "@/components/game/PlayerInfo";
import { MoveHistory } from "@/components/game/MoveHistory";
import { ChatPanel } from "@/components/game/ChatPanel";
import { GameControls } from "@/components/game/GameControls";
import { DrawOfferModal } from "@/components/game/DrawOfferModal";
import { GameResultModal } from "@/components/game/GameResultModal";
import { BoardColorPicker, useBoardColors } from "@/components/game/BoardColorPicker";

interface ChatMessage {
    id: string;
    username: string;
    message: string;
    timestamp: string;
    isGuest: boolean;
}

export default function GamePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const roomId = params.roomId as string;

    // Game state
    const [game, setGame] = useState(new Chess());
    const [room, setRoom] = useState<Room | null>(null);
    const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [legalMoves, setLegalMoves] = useState<Square[]>([]);

    // Timers - initialize to null to prevent flickering
    const [myTime, setMyTime] = useState<number | null>(null);
    const [opponentTime, setOpponentTime] = useState<number | null>(null);

    // Move history
    const [moveHistory, setMoveHistory] = useState<string[]>([]);

    // Chat
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Game end
    const [gameResult, setGameResult] = useState<{ winner: string; reason: string } | null>(null);

    // Draw offer
    const [drawOffered, setDrawOffered] = useState(false);
    const [drawOfferedBy, setDrawOfferedBy] = useState<string | null>(null);

    // Opponent status
    const [opponentDisconnected, setOpponentDisconnected] = useState(false);
    const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);
    const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Last move highlighting
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

    // Board colors (personalized per user)
    const boardColors = useBoardColors();

    // Refs to hold mutable values for socket callbacks without causing re-subscriptions
    const playerColorRef = useRef(playerColor);
    const roomRef = useRef(room);
    const isChatOpenRef = useRef(isChatOpen);
    const userRef = useRef(user);

    // Keep refs in sync
    useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);
    useEffect(() => { roomRef.current = room; }, [room]);
    useEffect(() => { isChatOpenRef.current = isChatOpen; }, [isChatOpen]);
    useEffect(() => { userRef.current = user; }, [user]);

    // Helper: resolve current player ID from user context OR localStorage fallback
    const getMyPlayerId = useCallback((): string | undefined => {
        const u = userRef.current;
        if (u) {
            return u.id || u._id || u.guestId;
        }
        // Fallback: user context hasn't populated yet (race condition during reconnection)
        const guestId = typeof window !== "undefined" ? localStorage.getItem("guestId") : null;
        if (guestId) return guestId;
        return undefined;
    }, []);

    // Restore move history + last move from PGN
    const restoreMoveHistoryFromPgn = useCallback((pgn: string) => {
        if (!pgn || pgn.trim() === "") {
            setMoveHistory([]);
            setLastMove(null);
            return;
        }
        try {
            const replayChess = new Chess();
            replayChess.loadPgn(pgn);
            const history = replayChess.history();
            setMoveHistory(history);

            // Restore last move highlighting
            const verboseHistory = replayChess.history({ verbose: true });
            if (verboseHistory.length > 0) {
                const last = verboseHistory[verboseHistory.length - 1];
                setLastMove({ from: last.from, to: last.to });
            } else {
                setLastMove(null);
            }
        } catch (e) {
            console.error("Failed to restore move history from PGN:", e);
            setMoveHistory([]);
            setLastMove(null);
        }
    }, []);

    // Core state restoration from room data
    const updateGameState = useCallback((roomData: Room) => {
        const newGame = new Chess(roomData.gameData.fen);
        setGame(newGame);

        const myId = getMyPlayerId();

        let myColor: "white" | "black";
        let myTimeLeft: number;
        let oppTimeLeft: number;

        if (myId && (roomData.player1.userId === myId || roomData.player1.guestId === myId)) {
            myColor = roomData.player1.color;
            myTimeLeft = roomData.player1.timeLeft;
            oppTimeLeft = roomData.player2.timeLeft;
        } else if (myId && (roomData.player2.userId === myId || roomData.player2.guestId === myId)) {
            myColor = roomData.player2.color;
            myTimeLeft = roomData.player2.timeLeft;
            oppTimeLeft = roomData.player1.timeLeft;
        } else {
            // Last resort fallback: we couldn't identify ourselves, default to player2
            myColor = roomData.player2.color;
            myTimeLeft = roomData.player2.timeLeft;
            oppTimeLeft = roomData.player1.timeLeft;
        }

        setPlayerColor(myColor);
        setMyTime(myTimeLeft);
        setOpponentTime(oppTimeLeft);
        setIsMyTurn(roomData.currentTurn === myColor);

        // Restore move history from PGN
        restoreMoveHistoryFromPgn(roomData.gameData.pgn);
    }, [getMyPlayerId, restoreMoveHistoryFromPgn]);

    // Store current room in localStorage for reconnection after refresh
    useEffect(() => {
        if (roomId) {
            localStorage.setItem("currentRoomId", roomId);
        }

        return () => {
            // Only clear if we're actually leaving the game (not just unmounting)
            // We'll clear this when the game ends or user explicitly leaves
        };
    }, [roomId]);

    // Cleanup disconnect timer on unmount
    useEffect(() => {
        return () => {
            if (disconnectTimerRef.current) {
                clearInterval(disconnectTimerRef.current);
            }
        };
    }, []);

    // Initialize socket listeners — retries until socket is available
    useEffect(() => {
        let cancelled = false;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        const cleanupFns: (() => void)[] = [];

        const setup = () => {
            if (cancelled) return;

            const socket = socketService.getSocket();
            if (!socket) {
                // Socket not created yet (AuthContext hasn't initialized)
                // Retry until it's available
                retryTimer = setTimeout(setup, 200);
                return;
            }

            socketService.joinRoom(roomId);

            cleanupFns.push(socketService.onRoomUpdate((data) => {
                setRoom(data.room);
                updateGameState(data.room);

                // Check if game ended
                if (data.room.gameStatus === "completed" && data.room.result) {
                    setGameResult({
                        winner: data.room.result.winner,
                        reason: data.room.result.reason,
                    });
                }
            }));

            cleanupFns.push(socketService.onGameStarted((data) => {
                setRoom(data.room);
                updateGameState(data.room);
            }));

            // Listen for reconnection event (full state restore)
            cleanupFns.push(socketService.onGameReconnected((data) => {
                console.log("Game reconnected — restoring full state");
                setRoom(data.room);
                updateGameState(data.room);
            }));

            cleanupFns.push(socketService.onMoveMade((data) => {
                const newGame = new Chess(data.fen);
                setGame(newGame);
                setMoveHistory((prev) => [...prev, data.move.san || `${data.move.from}-${data.move.to}`]);
                setIsMyTurn(data.currentTurn === playerColorRef.current);

                // Highlight last move
                setLastMove({ from: data.move.from, to: data.move.to });

                // Play appropriate move sound based on move type
                // Only play if it's our turn now (meaning the opponent made this move),
                // because local moves already played their sound instantly on drop/click.
                if (data.currentTurn === playerColorRef.current) {
                    soundManager.playMoveSound(data.move, newGame.isCheck());
                }

                // Check for game over
                if (newGame.isGameOver()) {
                    let winner = "draw";
                    let reason = "draw";

                    if (newGame.isCheckmate()) {
                        winner = newGame.turn() === "w" ? "black" : "white";
                        reason = "checkmate";
                    } else if (newGame.isStalemate()) {
                        reason = "stalemate";
                    } else if (newGame.isThreefoldRepetition()) {
                        reason = "repetition";
                    } else if (newGame.isInsufficientMaterial()) {
                        reason = "insufficient_material";
                    }

                    // Play notify sound and delay modal by 1 second
                    soundManager.playNotify();
                    setTimeout(() => {
                        setGameResult({ winner, reason });
                    }, 1000);
                }
            }));

            cleanupFns.push(socketService.onTimeUpdate((data) => {
                const currentRoom = roomRef.current;
                const currentColor = playerColorRef.current;
                if (currentRoom) {
                    const myPlayer = currentRoom.player1.color === currentColor ? "player1" : "player2";
                    setMyTime(myPlayer === "player1" ? data.player1TimeLeft : data.player2TimeLeft);
                    setOpponentTime(myPlayer === "player1" ? data.player2TimeLeft : data.player1TimeLeft);
                }
            }));

            cleanupFns.push(socketService.onGameEnded((data) => {
                console.log("Game ended event received:", data);
                soundManager.playNotify();
                // Clear disconnect state if game ends due to abandonment
                setOpponentDisconnected(false);
                setDisconnectCountdown(null);
                if (disconnectTimerRef.current) {
                    clearInterval(disconnectTimerRef.current);
                    disconnectTimerRef.current = null;
                }
                setTimeout(() => {
                    setGameResult(data.result);
                }, 1000);
            }));

            cleanupFns.push(socketService.onChatMessage((data) => {
                setChatMessages((prev) => [...prev, data]);
                if (!isChatOpenRef.current) {
                    setUnreadMessages((prev) => prev + 1);
                }
                // Play notify sound for new chat messages
                soundManager.playNotify();
            }));

            cleanupFns.push(socketService.onDrawOffered((data) => {
                setDrawOfferedBy(data.username);
                setDrawOffered(true);
            }));

            cleanupFns.push(socketService.onDrawDeclined(() => {
                setDrawOffered(false);
                setDrawOfferedBy(null);
                const toast = document.createElement("div");
                toast.className = "fixed top-4 right-4 bg-accent text-white px-6 py-3 rounded shadow-lg z-50";
                toast.textContent = "Draw offer declined";
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            }));

            cleanupFns.push(socketService.onOpponentDisconnected((data) => {
                setOpponentDisconnected(true);
                const grace = data?.graceSeconds || 60;
                setDisconnectCountdown(grace);

                // Start countdown
                if (disconnectTimerRef.current) {
                    clearInterval(disconnectTimerRef.current);
                }
                let remaining = grace;
                disconnectTimerRef.current = setInterval(() => {
                    remaining -= 1;
                    setDisconnectCountdown(remaining);
                    if (remaining <= 0) {
                        if (disconnectTimerRef.current) {
                            clearInterval(disconnectTimerRef.current);
                            disconnectTimerRef.current = null;
                        }
                    }
                }, 1000);
            }));

            cleanupFns.push(socketService.onOpponentReconnected(() => {
                setOpponentDisconnected(false);
                setDisconnectCountdown(null);
                if (disconnectTimerRef.current) {
                    clearInterval(disconnectTimerRef.current);
                    disconnectTimerRef.current = null;
                }
            }));
        };

        setup();

        return () => {
            cancelled = true;
            if (retryTimer) clearTimeout(retryTimer);
            cleanupFns.forEach((fn) => fn());
        };
    }, [roomId, updateGameState]);

    const onSquareClick = (square: Square) => {
        if (!isMyTurn || gameResult) return;

        if (selectedSquare) {
            const move = { from: selectedSquare, to: square, promotion: "q" };
            try {
                const result = game.move(move);
                if (result) {
                    socketService.makeMove(roomId, move);
                    setSelectedSquare(null);
                    setLegalMoves([]);

                    // Highlight last move
                    setLastMove({ from: selectedSquare, to: square });

                    // Play appropriate sound based on move type
                    const tempGame = new Chess(game.fen());
                    soundManager.playMoveSound(result, tempGame.isCheck());
                }
            } catch {
                selectPiece(square);
            }
        } else {
            selectPiece(square);
        }
    };

    const selectPiece = (square: Square) => {
        const piece = game.get(square);
        if (piece && piece.color === playerColor[0]) {
            setSelectedSquare(square);
            const moves = game.moves({ square, verbose: true });
            setLegalMoves(moves.map((m) => m.to));
        } else {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    };

    const onDrop = (sourceSquare: Square, targetSquare: Square) => {
        if (!isMyTurn || gameResult) return false;

        const move = { from: sourceSquare, to: targetSquare, promotion: "q" };
        try {
            const result = game.move(move);
            if (result) {
                socketService.makeMove(roomId, move);
                setSelectedSquare(null);
                setLegalMoves([]);

                // Highlight last move
                setLastMove({ from: sourceSquare, to: targetSquare });

                // Play appropriate sound based on move type
                const tempGame = new Chess(game.fen());
                soundManager.playMoveSound(result, tempGame.isCheck());
                return true;
            }
        } catch {
            return false;
        }
        return false;
    };

    const handleResign = () => {
        if (confirm("Are you sure you want to resign?")) {
            socketService.resign(roomId);
            localStorage.removeItem("currentRoomId");
        }
    };

    const handleOfferDraw = () => {
        socketService.offerDraw(roomId);
    };

    const handleDrawResponse = (accept: boolean) => {
        socketService.respondToDraw(roomId, accept);
        setDrawOffered(false);
        setDrawOfferedBy(null);
    };

    const handleSendChat = (message: string) => {
        socketService.sendMessage(roomId, message);
    };

    const handleToggleChat = () => {
        setIsChatOpen(!isChatOpen);
        if (!isChatOpen) {
            setUnreadMessages(0);
        }
    };

    // Custom square styles
    const customSquareStyles: Record<string, React.CSSProperties> = {};

    // Highlight last move (from and to squares)
    if (lastMove) {
        customSquareStyles[lastMove.from] = {
            backgroundColor: "rgba(255, 86, 86, 0.4)", // Yellow overlay for source
        };
        customSquareStyles[lastMove.to] = {
            backgroundColor: "rgba(255, 86, 86, 0.4)", // Yellow overlay for destination
        };
    }

    // Highlight king if in check
    if (game.isCheck()) {
        const kingColor = game.turn(); // 'w' or 'b' - the side that's in check
        const board = game.board();

        // Find the king's position
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type === 'k' && piece.color === kingColor) {
                    // Convert row/col to square notation (e.g., 'e1', 'e8')
                    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                    const kingSquare = `${files[col]}${8 - row}`;
                    customSquareStyles[kingSquare] = {
                        backgroundColor: "rgba(220, 38, 38, 0.7)",
                        boxShadow: "inset 0 0 20px rgba(220, 38, 38, 0.8)",
                    };
                }
            }
        }
    }

    if (selectedSquare) {
        customSquareStyles[selectedSquare] = {
            backgroundColor: "rgba(220, 38, 38, 0.4)",
        };
    }
    legalMoves.forEach((square) => {
        customSquareStyles[square] = {
            background: game.get(square)
                ? "radial-gradient(circle, rgba(220, 38, 38, 0.6) 85%, transparent 85%)"
                : "radial-gradient(circle, rgba(220, 38, 38, 0.4) 25%, transparent 25%)",
        };
    });

    const opponentName = room
        ? playerColor === room.player1.color
            ? room.player2.guestUsername || "Opponent"
            : room.player1.guestUsername || "Opponent"
        : "Opponent";

    const myName = user?.username || "You";

    // Responsive board size
    const boardWidth = typeof window !== 'undefined' ?
        (window.innerWidth < 768 ? Math.min(window.innerWidth - 32, 400) : 560) : 560;

    return (
        <div className="min-h-screen bg-background p-2 md:p-4 flex flex-col md:flex-row">
            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {/* Opponent Info */}
                <PlayerInfo
                    name={opponentName}
                    time={opponentTime}
                    color={playerColor === "white" ? "black" : "white"}
                    isMyTurn={!isMyTurn}
                    isActive={room?.gameStatus === "in_progress"}
                    disconnected={opponentDisconnected}
                />

                {/* Disconnect Countdown Banner */}
                <AnimatePresence>
                    {opponentDisconnected && disconnectCountdown !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="w-full max-w-lg my-2"
                        >
                            <div className="flex items-center justify-center gap-2 bg-red-900/80 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                                <span className="inline-block w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                                <span>
                                    Opponent disconnected — forfeit in{" "}
                                    <span className="font-mono font-bold text-white">
                                        {Math.floor(disconnectCountdown / 60)}:{String(disconnectCountdown % 60).padStart(2, "0")}
                                    </span>
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative my-2 md:my-4 mb-12 md:mb-14 flex justify-center">
                    <Chessboard
                        position={game.fen()}
                        onSquareClick={onSquareClick}
                        onPieceDrop={onDrop}
                        boardOrientation={playerColor}
                        customSquareStyles={customSquareStyles}
                        boardWidth={boardWidth}
                        customBoardStyle={{
                            borderRadius: "4px",
                            boxShadow: "0 0 30px rgba(0,0,0,0.5)",
                        }}
                        customDarkSquareStyle={{ backgroundColor: boardColors.dark }}
                        customLightSquareStyle={{ backgroundColor: boardColors.light }}
                    />

                    {/* Turn indicator */}
                    {isMyTurn && room?.gameStatus === "in_progress" && !gameResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -bottom-10  -translate-x-1/2 bg-accent px-4 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap shadow-lg"
                        >
                            YOUR TURN
                        </motion.div>
                    )}
                </div>

                {/* Player Info */}
                <PlayerInfo
                    name={myName}
                    time={myTime}
                    color={playerColor}
                    isMyTurn={isMyTurn}
                    isActive={room?.gameStatus === "in_progress"}
                    showColor
                />

                {/* Game Controls */}
                <div className="w-full md:w-auto flex items-center gap-2 justify-center">
                    <GameControls
                        onResign={handleResign}
                        onOfferDraw={handleOfferDraw}
                        onToggleChat={handleToggleChat}
                        disabled={!!gameResult}
                        drawOffered={drawOffered}
                        unreadCount={unreadMessages}
                    />
                    <BoardColorPicker />
                </div>
            </div>

            {/* Side Panel - Hidden on mobile, shows in modal when chat is opened */}
            <div className="hidden md:flex md:w-96 lg:w-[420px] flex-col gap-4 h-full">
                <MoveHistory moves={moveHistory} />
                <ChatPanel
                    isOpen={isChatOpen}
                    messages={chatMessages}
                    onClose={() => setIsChatOpen(false)}
                    onSend={handleSendChat}
                    currentUsername={myName}
                />
            </div>

            {/* Mobile Chat Panel - Full screen on mobile */}
            <div className="md:hidden">
                {isChatOpen && (
                    <div className="fixed inset-0 bg-background z-50 flex flex-col">
                        <ChatPanel
                            isOpen={true}
                            messages={chatMessages}
                            onClose={() => setIsChatOpen(false)}
                            onSend={handleSendChat}
                            currentUsername={myName}
                        />
                    </div>
                )}
            </div>

            {/* Draw Offer Modal */}
            <DrawOfferModal
                isOpen={drawOffered && !!drawOfferedBy}
                offeredBy={drawOfferedBy || ""}
                onAccept={() => handleDrawResponse(true)}
                onDecline={() => handleDrawResponse(false)}
            />

            {/* Game Result Modal */}
            <GameResultModal
                gameResult={gameResult}
                playerColor={playerColor}
                moveCount={moveHistory.length}
                roomId={roomId}
            />
        </div>
    );
}
