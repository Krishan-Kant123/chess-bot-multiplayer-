import { io, Socket } from "socket.io-client";

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private visibilityChangeHandler: (() => void) | null = null;

    getSocket(): Socket | null {
        return this.socket;
    }

    connect(token?: string, guestId?: string, guestUsername?: string): Socket | null {
        if (this.socket?.connected) {
            console.log("Socket already connected");
            return this.socket;
        }

        const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        this.socket = io(url, {
            auth: guestId ? { guestId, guestUsername } : { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        this.setupEventListeners();
        this.setupMobileHandlers();

        return this.socket;
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on("connect", () => {
            console.log("✅ Socket connected:", this.socket?.id);
            this.reconnectAttempts = 0;
        });

        this.socket.on("disconnect", (reason) => {
            console.log("❌ Socket disconnected:", reason);

            // Auto-reconnect on mobile when app comes back to foreground
            if (reason === "transport close" || reason === "ping timeout") {
                console.log("Attempting to reconnect...");
            }
        });

        this.socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error("Max reconnection attempts reached");
            }
        });

        this.socket.on("reconnect", (attemptNumber) => {
            console.log("✅ Socket reconnected after", attemptNumber, "attempts");
        });

        this.socket.on("error", (error) => {
            console.error("Socket error:", error);
        });
    }

    private setupMobileHandlers() {
        // Handle app going to background/foreground on mobile
        if (typeof document !== "undefined") {
            this.visibilityChangeHandler = () => {
                if (document.visibilityState === "visible") {
                    // App came to foreground
                    console.log("App visible - checking socket connection");
                    if (!this.socket?.connected) {
                        console.log("Socket disconnected while in background - reconnecting");
                        this.socket?.connect();
                    }
                } else {
                    // App went to background
                    console.log("App hidden - socket may disconnect");
                }
            };

            document.addEventListener("visibilitychange", this.visibilityChangeHandler);
        }

        // Handle page visibility for iOS Safari
        if (typeof window !== "undefined") {
            window.addEventListener("focus", () => {
                if (!this.socket?.connected) {
                    console.log("Window focused - reconnecting socket");
                    this.socket?.connect();
                }
            });
        }
    }

    disconnect() {
        if (this.visibilityChangeHandler) {
            document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Authentication
    authenticate(token: string) {
        this.socket?.emit("authenticate", token);
    }

    authenticateGuest(username: string, guestId?: string) {
        this.socket?.emit("authenticate_guest", { username, guestId });
    }

    // Room operations
    createRoom(data: {
        timeControl: number;
        matchType: "casual" | "rated" | "ai";
        isPrivate?: boolean;
        aiLevel?: number;
        preferredColor?: string;
    }) {
        this.socket?.emit("create_room", data);
    }

    joinRoom(roomId: string) {
        this.socket?.emit("join_room", { roomId });
    }

    joinRoomAsPlayer(roomId: string) {
        this.socket?.emit("join_room_as_player", { roomId });
    }

    joinQueue(data: {
        matchType: "casual" | "rated";
        timeControl: number;
        preferredColor: string;
    }) {
        this.socket?.emit("join_queue", data);
    }

    leaveQueue() {
        this.socket?.emit("leave_queue");
    }

    // Game actions
    makeMove(roomId: string, move: { from: string; to: string; promotion?: string }) {
        this.socket?.emit("make_move", { roomId, move });
    }

    resign(roomId: string) {
        this.socket?.emit("resign", { roomId });
    }

    offerDraw(roomId: string) {
        this.socket?.emit("offer_draw", { roomId });
    }

    respondToDraw(roomId: string, accept: boolean) {
        this.socket?.emit("draw_response", { roomId, accept });
    }

    sendMessage(roomId: string, message: string) {
        this.socket?.emit("send_message", { roomId, message });
    }

    // Event listeners
    onAuthenticated(callback: (data: any) => void) {
        this.socket?.on("authenticated", callback);
        return () => this.socket?.off("authenticated", callback);
    }

    onAuthError(callback: (data: any) => void) {
        this.socket?.on("authentication_error", callback);
        return () => this.socket?.off("authentication_error", callback);
    }

    onRoomCreated(callback: (data: any) => void) {
        this.socket?.on("room_created", callback);
        return () => this.socket?.off("room_created", callback);
    }

    onRoomUpdate(callback: (data: any) => void) {
        this.socket?.on("room_update", callback);
        return () => this.socket?.off("room_update", callback);
    }

    onGameStarted(callback: (data: any) => void) {
        this.socket?.on("game_started", callback);
        return () => this.socket?.off("game_started", callback);
    }

    onMatchFound(callback: (data: any) => void) {
        this.socket?.on("match_found", callback);
        return () => this.socket?.off("match_found", callback);
    }

    onMoveMade(callback: (data: any) => void) {
        this.socket?.on("move_made", callback);
        return () => this.socket?.off("move_made", callback);
    }

    onTimeUpdate(callback: (data: any) => void) {
        this.socket?.on("time_update", callback);
        return () => this.socket?.off("time_update", callback);
    }

    onGameEnded(callback: (data: any) => void) {
        this.socket?.on("game_ended", callback);
        return () => this.socket?.off("game_ended", callback);
    }

    onChatMessage(callback: (data: any) => void) {
        this.socket?.on("chat_message", callback);
        return () => this.socket?.off("chat_message", callback);
    }

    onDrawOffered(callback: (data: any) => void) {
        this.socket?.on("draw_offered", callback);
        return () => this.socket?.off("draw_offered", callback);
    }

    onDrawDeclined(callback: () => void) {
        this.socket?.on("draw_declined", callback);
        return () => this.socket?.off("draw_declined", callback);
    }

    onOpponentDisconnected(callback: () => void) {
        this.socket?.on("opponent_disconnected", callback);
        return () => this.socket?.off("opponent_disconnected", callback);
    }

    onOpponentReconnected(callback: () => void) {
        this.socket?.on("opponent_reconnected", callback);
        return () => this.socket?.off("opponent_reconnected", callback);
    }

    onGameReconnected(callback: (data: any) => void) {
        this.socket?.on("reconnected_to_game", callback);
        return () => this.socket?.off("reconnected_to_game", callback);
    }

    onQueueJoined(callback: (data: any) => void) {
        this.socket?.on("queue_joined", callback);
        return () => this.socket?.off("queue_joined", callback);
    }

    onError(callback: (data: any) => void) {
        this.socket?.on("error", callback);
        return () => this.socket?.off("error", callback);
    }
}

const socketService = new SocketService();
export default socketService;
