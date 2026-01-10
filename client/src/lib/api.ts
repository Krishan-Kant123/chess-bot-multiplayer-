const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.message || "An error occurred" };
        }

        return { data };
    } catch (error) {
        console.error("API Error:", error);
        return { error: "Network error. Please try again." };
    }
}

// Auth API
export const authApi = {
    register: (username: string, email: string, password: string) =>
        request<{ token: string; user: User }>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, email, password }),
        }),

    login: (email: string, password: string) =>
        request<{ token: string; user: User }>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),

    me: () => request<{ user: User }>("/api/auth/me"),

    logout: () => request("/api/auth/logout", { method: "POST" }),
};

// Rooms API
export const roomsApi = {
    create: (data: CreateRoomData) =>
        request<{ room: Room }>("/api/rooms/create", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    join: (roomId: string) =>
        request<{ room: Room }>(`/api/rooms/join/${roomId}`, {
            method: "POST",
        }),

    get: (roomId: string) => request<{ room: Room }>(`/api/rooms/${roomId}`),

    getHistory: (page = 1, limit = 20) =>
        request<{ matches: Match[]; pagination: Pagination }>(
            `/api/rooms/history/matches?page=${page}&limit=${limit}`
        ),

    getMatch: (matchId: string) =>
        request<{ match: Match }>(`/api/rooms/history/match/${matchId}`),

    getMatchByRoom: (roomId: string) =>
        request<{ match: Match }>(`/api/rooms/history/room/${roomId}`),
};

// Types
export interface User {
    id: string;
    _id?: string;
    username: string;
    email?: string;
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    isOnline?: boolean;
    isGuest?: boolean;
    guestId?: string;
}

export interface Room {
    roomId: string;
    player1: Player;
    player2: Player;
    gameStatus: "waiting" | "in_progress" | "finished" | "abandoned";
    currentTurn: "white" | "black";
    timeControl: number;
    matchType: "casual" | "rated" | "ai";
    gameData: GameData;
    result?: GameResult;
    isPrivate: boolean;
    aiLevel?: number;
}

export interface Player {
    userId?: string;
    guestId?: string;
    guestUsername?: string;
    color: "white" | "black";
    timeLeft: number;
}

export interface GameData {
    fen: string;
    pgn: string;
    moves: Move[];
}

export interface Move {
    from: string;
    to: string;
    piece: string;
    san?: string;
    fen?: string;
    timestamp?: Date;
    timeLeft?: number;
    moveNumber?: number;
}

export interface GameResult {
    winner: "white" | "black" | "draw";
    reason: string;
}

export interface Match {
    _id: string;
    userId: User;
    opponentId?: User;
    roomId: string;
    result: "win" | "loss" | "draw";
    userColor: "white" | "black";
    matchType: "casual" | "rated" | "ai";
    timeControl: number;
    ratingBefore: number;
    ratingAfter: number;
    ratingChange: number;
    gameData: {
        pgn: string;
        finalFen: string;
        startingFen?: string;
        moveCount: number;
        gameDuration: number;
        moves?: Move[];
    };
    endReason: string;
    createdAt: string;
}

export interface CreateRoomData {
    timeControl: number;
    matchType: "casual" | "rated" | "ai";
    isPrivate?: boolean;
    aiLevel?: number;
    isGuest?: boolean;
    guestUsername?: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}
