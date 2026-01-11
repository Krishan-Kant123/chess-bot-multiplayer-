"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

    // Last move highlighting
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

    // Board colors (personalized per user)
    const boardColors = useBoardColors();

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

            // Highlight last move
            setLastMove({ from: data.move.from, to: data.move.to });

            // Play appropriate move sound based on move type
            soundManager.playMoveSound(data.move, newGame.isCheck());

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
            soundManager.playNotify();
            setTimeout(() => {
                setGameResult(data.result);
            }, 1000);
        });

        const unsubChat = socketService.onChatMessage((data) => {
            setChatMessages((prev) => [...prev, data]);
            if (!isChatOpen) {
                setUnreadMessages((prev) => prev + 1);
            }
            // Play notify sound for new chat messages
            soundManager.playNotify();
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
