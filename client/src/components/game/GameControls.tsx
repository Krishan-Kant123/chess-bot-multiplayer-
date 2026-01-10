"use client";

import { Button } from "@/components/ui/button";
import { Flag, Handshake, MessageSquare } from "lucide-react";

interface GameControlsProps {
    onResign: () => void;
    onOfferDraw: () => void;
    onToggleChat: () => void;
    disabled: boolean;
    drawOffered: boolean;
    unreadCount?: number;
}

export function GameControls({
    onResign,
    onOfferDraw,
    onToggleChat,
    disabled,
    drawOffered,
    unreadCount = 0,
}: GameControlsProps) {
    return (
        <div className="flex gap-4 mt-6">
            <Button variant="secondary" onClick={onResign} disabled={disabled}>
                <Flag className="w-4 h-4" />
                RESIGN
            </Button>
            <Button
                variant="secondary"
                onClick={onOfferDraw}
                disabled={disabled || drawOffered}
            >
                <Handshake className="w-4 h-4" />
                OFFER DRAW
            </Button>
            <Button variant="secondary" onClick={onToggleChat} className="relative">
                <MessageSquare className="w-4 h-4" />
                CHAT
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {unreadCount}
                    </span>
                )}
            </Button>
        </div>
    );
}
