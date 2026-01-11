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
        <div className="flex gap-2 md:gap-4 mt-4 md:mt-6 justify-center">
            <Button variant="secondary" onClick={onResign} disabled={disabled} size="sm" className="md:size-default">
                <Flag className="w-4 h-4" />
                <span className="hidden md:inline ml-2">RESIGN</span>
            </Button>
            <Button
                variant="secondary"
                onClick={onOfferDraw}
                disabled={disabled || drawOffered}
                size="sm"
                className="md:size-default"
            >
                <Handshake className="w-4 h-4" />
                <span className="hidden md:inline ml-2">OFFER DRAW</span>
            </Button>
            <Button variant="secondary" onClick={onToggleChat} className="relative" size="sm">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline ml-2">CHAT</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {unreadCount}
                    </span>
                )}
            </Button>
        </div>
    );
}
