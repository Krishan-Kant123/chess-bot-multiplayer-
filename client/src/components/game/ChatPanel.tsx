"use client";

import { useState, useRef, useEffect } from "react";
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
    currentUsername?: string; // Add current user's username for comparison
}

export function ChatPanel({ isOpen, messages, onClose, onSend, currentUsername }: ChatPanelProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex-1 flex flex-col min-h-0"
                >
                    <Card className="h-full p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg">CHAT</h3>
                            <button onClick={onClose}>
                                <X className="w-4 h-4 text-foreground-muted" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
                            {messages.map((msg) => {
                                const isCurrentUser = msg.username === currentUsername;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <span className="text-xs text-foreground-dim mb-1">
                                                {msg.username}
                                            </span>
                                            <div
                                                className={`rounded-lg px-3 py-2 ${isCurrentUser
                                                    ? 'bg-accent text-white rounded-br-none'
                                                    : 'bg-background-elevated text-foreground rounded-bl-none'
                                                    }`}
                                            >
                                                <span className="text-sm break-words">{msg.message}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
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
