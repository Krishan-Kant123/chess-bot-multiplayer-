"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useAuth } from "@/context/AuthContext";
import socketService from "@/lib/socket";
import { Room, Move } from "@/lib/api";
import { PlayerInfo } from "@/components/game/PlayerInfo";
import { MoveHistory } from "@/components/game/MoveHistory";
import { ChatPanel } from "@/components/game/ChatPanel";
import { GameControls } from "@/components/game/GameControls";
import { DrawOfferModal } from "@/components/game/DrawOfferModal";
import { GameResultModal } from "@/components/game/GameResultModal";

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

    // Initialize socket listeners
    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket) {
            console.log("No socket available");
            return;
        }

        // console.log("Setting up game listeners for room:", roomId);
        socketService.joinRoom(roomId);

        const unsubRoomUpdate = socketService.onRoomUpdate((data) => {
            // console.log("Room update received");
            setRoom(data.room);
            updateGameState(data.room);

            // Check if game ended
            if (data.room.gameStatus === "completed" && data.room.result) {
                // console.log("Game completed");
                setGameResult({
                    winner: data.room.result.winner,
                    reason: data.room.result.reason,
                });
            }
        });

        const unsubGameStarted = socketService.onGameStarted((data) => {
            // console.log("Game started");
            setRoom(data.room);
            updateGameState(data.room);
        });

        const unsubMoveMade = socketService.onMoveMade((data) => {
            const newGame = new Chess(data.fen);
            setGame(newGame);
            setMoveHistory((prev) => [...prev, data.move.san || `${data.move.from}-${data.move.to}`]);
            setIsMyTurn(data.currentTurn === playerColor);

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

                // console.log("Client detected game over:", { winner, reason });
                setGameResult({ winner, reason });
            }
        });

        const unsubTimeUpdate = socketService.onTimeUpdate((data) => {
            if (room) {
                const myPlayer = room.player1.color === playerColor ? "player1" : "player2";
                setMyTime(myPlayer === "player1" ? data.player1TimeLeft : data.player2TimeLeft);
                setOpponentTime(myPlayer === "player1" ? data.player2TimeLeft : data.player1TimeLeft);
            }
        });

        const unsubGameEnded = socketService.onGameEnded((data) => {
            console.log("Game ended event received:", data);
            setGameResult(data.result);
        });

        const unsubChat = socketService.onChatMessage((data) => {
            setChatMessages((prev) => [...prev, data]);
            if (!isChatOpen) {
                setUnreadMessages((prev) => prev + 1);
            }
        });

        const unsubDrawOffered = socketService.onDrawOffered((data) => {
            setDrawOfferedBy(data.username);
            setDrawOffered(true);
        });

        const unsubDrawDeclined = socketService.onDrawDeclined(() => {
            setDrawOffered(false);
            setDrawOfferedBy(null);
            const toast = document.createElement("div");
            toast.className = "fixed top-4 right-4 bg-accent text-white px-6 py-3 rounded shadow-lg z-50";
            toast.textContent = "Draw offer declined";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        });

        const unsubOpponentDisconnected = socketService.onOpponentDisconnected(() => {
            setOpponentDisconnected(true);
        });

        const unsubOpponentReconnected = socketService.onOpponentReconnected(() => {
            setOpponentDisconnected(false);
        });

        return () => {
            unsubRoomUpdate();
            unsubGameStarted();
            unsubMoveMade();
            unsubTimeUpdate();
            unsubGameEnded();
            unsubChat();
            unsubDrawOffered();
            unsubDrawDeclined();
            unsubOpponentDisconnected();
            unsubOpponentReconnected();
        };
    }, [roomId, playerColor, room, isChatOpen]);

    const updateGameState = (roomData: Room) => {
        const newGame = new Chess(roomData.gameData.fen);
        setGame(newGame);

        const myId = user?.id || user?._id || user?.guestId;

        let myColor: "white" | "black";
        let myTimeLeft: number;
        let oppTimeLeft: number;

        if (roomData.player1.userId === myId || roomData.player1.guestId === myId) {
            myColor = roomData.player1.color;
            myTimeLeft = roomData.player1.timeLeft;
            oppTimeLeft = roomData.player2.timeLeft;
        } else {
            myColor = roomData.player2.color;
            myTimeLeft = roomData.player2.timeLeft;
            oppTimeLeft = roomData.player1.timeLeft;
        }

        setPlayerColor(myColor);
        setMyTime(myTimeLeft);
        setOpponentTime(oppTimeLeft);
        setIsMyTurn(roomData.currentTurn === myColor);
    };

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


                <div className="relative my-2 md:my-4 flex justify-center">
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
                        customDarkSquareStyle={{ backgroundColor: "#1a1a1a" }}
                        customLightSquareStyle={{ backgroundColor: "#2a2a2a" }}
                    />

                    {/* Turn indicator */}
                    {isMyTurn && room?.gameStatus === "in_progress" && !gameResult && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute below  left-1/2 -translate-x-1/2 bg-accent px-4 py-1 rounded-full text-xs md:text-sm font-semibold"
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
                <div className="w-full md:w-auto">
                    <GameControls
                        onResign={handleResign}
                        onOfferDraw={handleOfferDraw}
                        onToggleChat={handleToggleChat}
                        disabled={!!gameResult}
                        drawOffered={drawOffered}
                        unreadCount={unreadMessages}
                    />
                </div>
            </div>

            {/* Side Panel - Hidden on mobile, shows in modal when chat is opened */}
            <div className="hidden md:flex md:w-80 flex-col gap-4">
                <MoveHistory moves={moveHistory} />
                <ChatPanel
                    isOpen={isChatOpen}
                    messages={chatMessages}
                    onClose={() => setIsChatOpen(false)}
                    onSend={handleSendChat}
                />
            </div>

            {/* Mobile Chat Panel - Full screen on mobile */}
            <div className="md:hidden">
                {isChatOpen && (
                    <div className="fixed inset-0 bg-background z-50 flex flex-col">
                        <div className="flex-1 flex flex-col">
                            <MoveHistory moves={moveHistory} />
                            <ChatPanel
                                isOpen={true}
                                messages={chatMessages}
                                onClose={() => setIsChatOpen(false)}
                                onSend={handleSendChat}
                            />
                        </div>
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
