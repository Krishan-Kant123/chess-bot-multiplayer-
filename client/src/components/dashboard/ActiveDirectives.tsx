"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Zap, Trophy, Crown, LucideIcon } from "lucide-react";

interface Directive {
    title: string;
    icon: LucideIcon;
    progress: number;
    total: number;
    status: string;
}

interface ActiveDirectivesProps {
    directives?: Directive[];
}

export function ActiveDirectives({ directives = [] }: ActiveDirectivesProps) {
    if (directives.length === 0) {
        return null; // Don't show section if no real directives
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-accent" />
                    <h3 className="font-display text-xl">ACTIVE DIRECTIVES</h3>
                </div>
                <span className="text-xs text-foreground-dim">RESETS IN 04:23:12</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {directives.map((directive, index) => (
                    <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-white text-sm">
                                {directive.title}
                            </span>
                            <directive.icon className="w-5 h-5 text-foreground-muted" />
                        </div>
                        <div className="h-1 bg-background-elevated rounded-full mb-2">
                            <div
                                className="h-full bg-accent rounded-full transition-all"
                                style={{
                                    width: `${(directive.progress / directive.total) * 100}%`,
                                }}
                            />
                        </div>
                        <span
                            className={`text-xs ${directive.progress === 0 ? "text-accent" : "text-foreground-dim"
                                }`}
                        >
                            {directive.status}
                        </span>
                    </Card>
                ))}
            </div>
        </motion.div>
    );
}
