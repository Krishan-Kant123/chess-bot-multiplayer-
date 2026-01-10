"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DrawScreenProps {
    reason: string;
}

export function DrawScreen({ reason }: DrawScreenProps) {
    const router = useRouter();

    return (
        <div className="w-full h-full bg-background flex items-center justify-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
            >
                <h1 className="font-display text-8xl text-foreground-muted mb-4">DRAW</h1>
                <p className="text-foreground-dim uppercase tracking-widest mb-8">
                    {reason.replace(/_/g, " ")}
                </p>
                <div className="flex gap-4 justify-center">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => router.push("/dashboard")}
                    >
                        LOBBY
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
