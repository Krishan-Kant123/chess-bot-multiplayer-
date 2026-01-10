"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Handshake } from "lucide-react";

interface DrawOfferModalProps {
    isOpen: boolean;
    offeredBy: string;
    onAccept: () => void;
    onDecline: () => void;
}

export function DrawOfferModal({
    isOpen,
    offeredBy,
    onAccept,
    onDecline,
}: DrawOfferModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                >
                    <Card className="p-8 text-center max-w-md">
                        <Handshake className="w-16 h-16 text-accent mx-auto mb-4" />
                        <h2 className="font-display text-2xl mb-2">DRAW OFFERED</h2>
                        <p className="text-foreground-muted mb-6">
                            {offeredBy} has offered a draw.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={onAccept}>ACCEPT</Button>
                            <Button variant="secondary" onClick={onDecline}>
                                DECLINE
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
