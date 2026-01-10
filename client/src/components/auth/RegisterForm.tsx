"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, Mail, ArrowRight } from "lucide-react";

interface RegisterFormProps {
    onSubmit: (username: string, email: string, password: string) => void;
    isLoading: boolean;
    error: string;
}

export function RegisterForm({ onSubmit, isLoading, error }: RegisterFormProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(username, email, password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs text-gray-500 mb-2 tracking-widest">
                    USERNAME / ID
                </label>
                <Input
                    type="text"
                    placeholder="AGENT_ID_00"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
                    icon={<User className="w-4 h-4" />}
                    required
                />
            </div>

            <div>
                <label className="block text-xs text-gray-500 mb-2 tracking-widest">
                    EMAIL
                </label>
                <Input
                    type="email"
                    placeholder="agent@elite.chess"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
                    icon={<Mail className="w-4 h-4" />}
                    required
                />
            </div>

            <div>
                <label className="block text-xs text-gray-500 mb-2 tracking-widest">
                    PASSCODE
                </label>
                <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-400"
                    icon={<Lock className="w-4 h-4" />}
                    required
                />
            </div>

            {error && (
                <p className="text-red-600 text-sm">{error}</p>
            )}

            <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white"
                size="lg"
                disabled={isLoading}
            >
                {isLoading ? "AUTHENTICATING..." : "AUTHENTICATE"}
                <ArrowRight className="w-4 h-4" />
            </Button>
        </form>
    );
}
