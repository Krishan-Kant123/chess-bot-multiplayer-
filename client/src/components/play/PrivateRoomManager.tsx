"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Copy, Check, ArrowRight } from "lucide-react";

interface PrivateRoomManagerProps {
    createdRoomCode: string;
    onCreateRoom: () => void;
    onJoinRoom: (roomId: string) => void;
}

export function PrivateRoomManager({
    createdRoomCode,
    onCreateRoom,
    onJoinRoom,
}: PrivateRoomManagerProps) {
    const [joinRoomId, setJoinRoomId] = useState("");
    const [copied, setCopied] = useState(false);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(createdRoomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex-1 space-y-4 md:space-y-6">
            {/* Create Room */}
            <Card className="p-4 md:p-6">
                <h4 className="font-semibold text-white mb-3 md:mb-4 text-sm md:text-base">CREATE ROOM</h4>
                {createdRoomCode ? (
                    <div className="space-y-3 md:space-y-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                            <div className="flex-1 bg-background-elevated px-3 md:px-4 py-2 md:py-3 rounded font-mono text-lg md:text-xl text-accent text-center sm:text-left">
                                {createdRoomCode}
                            </div>
                            <Button onClick={copyRoomCode} variant="secondary" className="w-full sm:w-auto">
                                {copied ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
                                <span className="ml-2 sm:hidden">{copied ? "Copied!" : "Copy Code"}</span>
                            </Button>
                        </div>
                        <p className="text-xs md:text-sm text-foreground-muted">
                            Share this code with your friend. Waiting for them to join...
                        </p>
                    </div>
                ) : (
                    <Button onClick={onCreateRoom} size="lg" className="w-full sm:w-auto">
                        <Users className="w-4 h-4 md:w-5 md:h-5" />
                        CREATE PRIVATE ROOM
                    </Button>
                )}
            </Card>

            {/* Join Room */}
            <Card className="p-4 md:p-6">
                <h4 className="font-semibold text-white mb-3 md:mb-4 text-sm md:text-base">JOIN ROOM</h4>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <Input
                        placeholder="Enter room code (e.g., ABCD-1234)"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                        className="flex-1 font-mono text-sm md:text-base"
                    />
                    <Button
                        onClick={() => onJoinRoom(joinRoomId.trim())}
                        disabled={!joinRoomId.trim()}
                        className="w-full sm:w-auto"
                    >
                        JOIN
                        <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
