"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, LogIn } from "lucide-react";

interface GuestLoginProps {
    onLogin: (username: string) => void;
}

export function GuestLogin({ onLogin }: GuestLoginProps) {
    const [username, setUsername] = useState("");

    const handleLogin = () => {
        if (username.trim().length >= 2) {
            onLogin(username.trim());
        }
    };

    return (
        <div className="space-y-4">
            <Input
                type="text"
                placeholder="Enter your callsign..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
            />

            <Button
                onClick={handleLogin}
                className="w-full bg-black hover:bg-gray-900 text-white"
                size="lg"
                disabled={username.trim().length < 2}
            >
                CONTINUE AS GUEST
                <LogIn className="w-4 h-4" />
            </Button>

            <div className="mt-8 p-4 bg-black/20 rounded">
                <p className="text-xs text-white/60 uppercase tracking-wider mb-2">
                    Guest Limitations:
                </p>
                <ul className="text-sm text-white/80 space-y-1">
                    <li>• Casual games only</li>
                    <li>• No ELO ranking</li>
                    <li>• Limited match history</li>
                </ul>
            </div>
        </div>
    );
}
