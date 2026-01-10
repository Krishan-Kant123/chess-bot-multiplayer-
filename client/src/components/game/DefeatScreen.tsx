"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DefeatScreenProps {
    reason: string;
    roomId: string;
}

export function DefeatScreen({ reason, roomId }: DefeatScreenProps) {
    const router = useRouter();

    return (
        <div className="w-full h-full bg-background flex items-center justify-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center relative"
            >
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-accent transform -rotate-6" />
                <h1 className="font-display text-9xl text-white mb-4 relative line-through decoration-accent">
                    DEFEAT
                </h1>
                <p className="text-accent uppercase tracking-widest mb-2 text-xl">
                    {reason.replace(/_/g, " ")}
                </p>
                <p className="text-foreground-dim uppercase tracking-widest mb-8">
                    THE KING HAS FALLEN.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button className="bg-accent hover:bg-accent-light" size="lg" onClick={() => router.push("/dashboard")}>
                        LOBBY
                    </Button>
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => router.push(`/analysis/${roomId}`)}
                    >
                        ANALYSIS
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
