"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, User } from "@/lib/api";
import socketService from "@/lib/socket";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isGuest: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginAsGuest: (username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem("token");
            const guestId = localStorage.getItem("guestId");
            const guestUsername = localStorage.getItem("guestUsername");

            // Connect socket
            const socket = socketService.connect();

            if (token) {
                // Try to authenticate with token
                const { data, error } = await authApi.me();
                if (data?.user) {
                    setUser(data.user);
                    socketService.authenticate(token);
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
                    guestId,
                });
                socketService.authenticateGuest(guestUsername, guestId);
            }

            setIsLoading(false);

            // Listen for auth events
            socketService.onAuthenticated((data) => {
                if (data.user.isGuest) {
                    localStorage.setItem("guestId", data.user.guestId || data.user.id);
                    localStorage.setItem("guestUsername", data.user.username);
                }
                setUser(data.user);
            });

            socketService.onAuthError((data) => {
                console.error("Auth error:", data.message);
            });
        };

        initAuth();

        return () => {
            socketService.disconnect();
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { data, error } = await authApi.login(email, password);

        if (data?.token && data?.user) {
            localStorage.setItem("token", data.token);
            localStorage.removeItem("guestId");
            localStorage.removeItem("guestUsername");
            setUser(data.user);
            socketService.authenticate(data.token);
            return { success: true };
        }

        return { success: false, error: error || "Login failed" };
    }, []);

    const register = useCallback(async (username: string, email: string, password: string) => {
        const { data, error } = await authApi.register(username, email, password);

        if (data?.token && data?.user) {
            localStorage.setItem("token", data.token);
            localStorage.removeItem("guestId");
            localStorage.removeItem("guestUsername");
            setUser(data.user);
            socketService.authenticate(data.token);
            return { success: true };
        }

        return { success: false, error: error || "Registration failed" };
    }, []);

    const loginAsGuest = useCallback((username: string) => {
        const existingGuestId = localStorage.getItem("guestId");
        socketService.authenticateGuest(username, existingGuestId || undefined);

        // User will be set when we receive the authenticated event
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("guestId");
        localStorage.removeItem("guestUsername");
        setUser(null);
        socketService.disconnect();
        window.location.href = "/";
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                isGuest: user?.isGuest || false,
                login,
                register,
                loginAsGuest,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
