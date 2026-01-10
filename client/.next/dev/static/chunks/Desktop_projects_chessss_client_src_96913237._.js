(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/projects/chessss/client/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authApi",
    ()=>authApi,
    "roomsApi",
    ()=>roomsApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Desktop/projects/chessss/client/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_URL = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
async function request(endpoint, options = {}) {
    const token = ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem("token") : "TURBOPACK unreachable";
    const headers = {
        "Content-Type": "application/json",
        ...token && {
            Authorization: `Bearer ${token}`
        },
        ...options.headers
    };
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        const data = await response.json();
        if (!response.ok) {
            return {
                error: data.message || "An error occurred"
            };
        }
        return {
            data
        };
    } catch (error) {
        console.error("API Error:", error);
        return {
            error: "Network error. Please try again."
        };
    }
}
const authApi = {
    register: (username, email, password)=>request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({
                username,
                email,
                password
            })
        }),
    login: (email, password)=>request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        }),
    me: ()=>request("/api/auth/me"),
    logout: ()=>request("/api/auth/logout", {
            method: "POST"
        })
};
const roomsApi = {
    create: (data)=>request("/api/rooms/create", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    join: (roomId)=>request(`/api/rooms/join/${roomId}`, {
            method: "POST"
        }),
    get: (roomId)=>request(`/api/rooms/${roomId}`),
    getHistory: (page = 1, limit = 20)=>request(`/api/rooms/history/matches?page=${page}&limit=${limit}`),
    getMatch: (matchId)=>request(`/api/rooms/history/match/${matchId}`),
    getMatchByRoom: (roomId)=>request(`/api/rooms/history/room/${roomId}`)
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/projects/chessss/client/src/lib/socket.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Desktop/projects/chessss/client/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/projects/chessss/client/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
;
class SocketService {
    socket = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    visibilityChangeHandler = null;
    getSocket() {
        return this.socket;
    }
    connect(token, guestId, guestUsername) {
        if (this.socket?.connected) {
            console.log("Socket already connected");
            return this.socket;
        }
        const url = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        this.socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])(url, {
            auth: guestId ? {
                guestId,
                guestUsername
            } : {
                token
            },
            transports: [
                "websocket",
                "polling"
            ],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });
        this.setupEventListeners();
        this.setupMobileHandlers();
        return this.socket;
    }
    setupEventListeners() {
        if (!this.socket) return;
        this.socket.on("connect", ()=>{
            console.log("✅ Socket connected:", this.socket?.id);
            this.reconnectAttempts = 0;
        });
        this.socket.on("disconnect", (reason)=>{
            console.log("❌ Socket disconnected:", reason);
            // Auto-reconnect on mobile when app comes back to foreground
            if (reason === "transport close" || reason === "ping timeout") {
                console.log("Attempting to reconnect...");
            }
        });
        this.socket.on("connect_error", (error)=>{
            console.error("Socket connection error:", error);
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error("Max reconnection attempts reached");
            }
        });
        this.socket.on("reconnect", (attemptNumber)=>{
            console.log("✅ Socket reconnected after", attemptNumber, "attempts");
        });
        this.socket.on("error", (error)=>{
            console.error("Socket error:", error);
        });
    }
    setupMobileHandlers() {
        // Handle app going to background/foreground on mobile
        if (typeof document !== "undefined") {
            this.visibilityChangeHandler = ()=>{
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
        if ("TURBOPACK compile-time truthy", 1) {
            window.addEventListener("focus", ()=>{
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
    authenticate(token) {
        this.socket?.emit("authenticate", token);
    }
    authenticateGuest(username, guestId) {
        this.socket?.emit("authenticate_guest", {
            username,
            guestId
        });
    }
    // Room operations
    createRoom(data) {
        this.socket?.emit("create_room", data);
    }
    joinRoom(roomId) {
        this.socket?.emit("join_room", {
            roomId
        });
    }
    joinRoomAsPlayer(roomId) {
        this.socket?.emit("join_room_as_player", {
            roomId
        });
    }
    joinQueue(data) {
        this.socket?.emit("join_queue", data);
    }
    leaveQueue() {
        this.socket?.emit("leave_queue");
    }
    // Game actions
    makeMove(roomId, move) {
        this.socket?.emit("make_move", {
            roomId,
            move
        });
    }
    resign(roomId) {
        this.socket?.emit("resign", {
            roomId
        });
    }
    offerDraw(roomId) {
        this.socket?.emit("offer_draw", {
            roomId
        });
    }
    respondToDraw(roomId, accept) {
        this.socket?.emit("draw_response", {
            roomId,
            accept
        });
    }
    sendMessage(roomId, message) {
        this.socket?.emit("send_message", {
            roomId,
            message
        });
    }
    // Event listeners
    onAuthenticated(callback) {
        this.socket?.on("authenticated", callback);
        return ()=>this.socket?.off("authenticated", callback);
    }
    onAuthError(callback) {
        this.socket?.on("authentication_error", callback);
        return ()=>this.socket?.off("authentication_error", callback);
    }
    onRoomCreated(callback) {
        this.socket?.on("room_created", callback);
        return ()=>this.socket?.off("room_created", callback);
    }
    onRoomUpdate(callback) {
        this.socket?.on("room_update", callback);
        return ()=>this.socket?.off("room_update", callback);
    }
    onGameStarted(callback) {
        this.socket?.on("game_started", callback);
        return ()=>this.socket?.off("game_started", callback);
    }
    onMatchFound(callback) {
        this.socket?.on("match_found", callback);
        return ()=>this.socket?.off("match_found", callback);
    }
    onMoveMade(callback) {
        this.socket?.on("move_made", callback);
        return ()=>this.socket?.off("move_made", callback);
    }
    onTimeUpdate(callback) {
        this.socket?.on("time_update", callback);
        return ()=>this.socket?.off("time_update", callback);
    }
    onGameEnded(callback) {
        this.socket?.on("game_ended", callback);
        return ()=>this.socket?.off("game_ended", callback);
    }
    onChatMessage(callback) {
        this.socket?.on("chat_message", callback);
        return ()=>this.socket?.off("chat_message", callback);
    }
    onDrawOffered(callback) {
        this.socket?.on("draw_offered", callback);
        return ()=>this.socket?.off("draw_offered", callback);
    }
    onDrawDeclined(callback) {
        this.socket?.on("draw_declined", callback);
        return ()=>this.socket?.off("draw_declined", callback);
    }
    onOpponentDisconnected(callback) {
        this.socket?.on("opponent_disconnected", callback);
        return ()=>this.socket?.off("opponent_disconnected", callback);
    }
    onOpponentReconnected(callback) {
        this.socket?.on("opponent_reconnected", callback);
        return ()=>this.socket?.off("opponent_reconnected", callback);
    }
    onGameReconnected(callback) {
        this.socket?.on("reconnected_to_game", callback);
        return ()=>this.socket?.off("reconnected_to_game", callback);
    }
    onQueueJoined(callback) {
        this.socket?.on("queue_joined", callback);
        return ()=>this.socket?.off("queue_joined", callback);
    }
    onError(callback) {
        this.socket?.on("error", callback);
        return ()=>this.socket?.off("error", callback);
    }
}
const socketService = new SocketService();
const __TURBOPACK__default__export__ = socketService;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/projects/chessss/client/src/context/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/projects/chessss/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/projects/chessss/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/projects/chessss/client/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/projects/chessss/client/src/lib/socket.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Initialize auth on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const initAuth = {
                "AuthProvider.useEffect.initAuth": async ()=>{
                    const token = localStorage.getItem("token");
                    const guestId = localStorage.getItem("guestId");
                    const guestUsername = localStorage.getItem("guestUsername");
                    // Connect socket
                    const socket = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].connect();
                    if (token) {
                        // Try to authenticate with token
                        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].me();
                        if (data?.user) {
                            setUser(data.user);
                            __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].authenticate(token);
                        } else {
                            // Token invalid, clear it
                            localStorage.removeItem("token");
                        }
                    } else if (guestId && guestUsername) {
                        // Reconnect as guest
                        setUser({
                            id: guestId,
                            username: guestUsername,
                            rating: 600,
                            gamesPlayed: 0,
                            wins: 0,
                            losses: 0,
                            draws: 0,
                            isGuest: true,
                            guestId
                        });
                        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].authenticateGuest(guestUsername, guestId);
                    }
                    setIsLoading(false);
                    // Listen for auth events
                    __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].onAuthenticated({
                        "AuthProvider.useEffect.initAuth": (data)=>{
                            if (data.user.isGuest) {
                                localStorage.setItem("guestId", data.user.guestId || data.user.id);
                                localStorage.setItem("guestUsername", data.user.username);
                            }
                            setUser(data.user);
                        }
                    }["AuthProvider.useEffect.initAuth"]);
                    __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].onAuthError({
                        "AuthProvider.useEffect.initAuth": (data)=>{
                            console.error("Auth error:", data.message);
                        }
                    }["AuthProvider.useEffect.initAuth"]);
                }
            }["AuthProvider.useEffect.initAuth"];
            initAuth();
            return ({
                "AuthProvider.useEffect": ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].disconnect();
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], []);
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[login]": async (email, password)=>{
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].login(email, password);
            if (data?.token && data?.user) {
                localStorage.setItem("token", data.token);
                localStorage.removeItem("guestId");
                localStorage.removeItem("guestUsername");
                setUser(data.user);
                __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].authenticate(data.token);
                return {
                    success: true
                };
            }
            return {
                success: false,
                error: error || "Login failed"
            };
        }
    }["AuthProvider.useCallback[login]"], []);
    const register = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[register]": async (username, email, password)=>{
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].register(username, email, password);
            if (data?.token && data?.user) {
                localStorage.setItem("token", data.token);
                localStorage.removeItem("guestId");
                localStorage.removeItem("guestUsername");
                setUser(data.user);
                __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].authenticate(data.token);
                return {
                    success: true
                };
            }
            return {
                success: false,
                error: error || "Registration failed"
            };
        }
    }["AuthProvider.useCallback[register]"], []);
    const loginAsGuest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[loginAsGuest]": (username)=>{
            const existingGuestId = localStorage.getItem("guestId");
            __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].authenticateGuest(username, existingGuestId || undefined);
        // User will be set when we receive the authenticated event
        }
    }["AuthProvider.useCallback[loginAsGuest]"], []);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[logout]": ()=>{
            localStorage.removeItem("token");
            localStorage.removeItem("guestId");
            localStorage.removeItem("guestUsername");
            setUser(null);
            __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$src$2f$lib$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].disconnect();
            window.location.href = "/";
        }
    }["AuthProvider.useCallback[logout]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            isLoading,
            isAuthenticated: !!user,
            isGuest: user?.isGuest || false,
            login,
            register,
            loginAsGuest,
            logout
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/Desktop/projects/chessss/client/src/context/AuthContext.tsx",
        lineNumber: 130,
        columnNumber: 9
    }, this);
}
_s(AuthProvider, "cx2oIAvCrCD2O15+XN4VtZ+hwCY=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$projects$2f$chessss$2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Desktop_projects_chessss_client_src_96913237._.js.map