"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Send } from "lucide-react";

interface ChatMessage {
    id: string;
    username: string;
    message: string;
    timestamp: string;
    isGuest: boolean;
}

interface ChatPanelProps {
    isOpen: boolean;
    messages: ChatMessage[];
    onClose: () => void;
    onSend: (message: string) => void;
}

export function ChatPanel({ isOpen, messages, onClose, onSend }: ChatPanelProps) {
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (input.trim()) {
            onSend(input.trim());
            setInput("");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 300 }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <Card className="h-full p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg">CHAT</h3>
                            <button onClick={onClose}>
                                <X className="w-4 h-4 text-foreground-muted" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className="text-sm">
                                    <span className="text-accent font-semibold">
                                        {msg.username}:{" "}
                                    </span>
                                    <span className="text-foreground-muted">{msg.message}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Type message..."
                                className="flex-1"
                            />
                            <Button onClick={handleSend} size="icon">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
