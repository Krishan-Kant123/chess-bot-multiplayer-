"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Swords,
    Crown,
    Trophy,
    Zap,
    Users,
    Bot,
    ChevronRight,
    Sparkles
} from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background bg-grid overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display text-xl tracking-wider">ELITE CHESS</span>
                        <span className="text-foreground-dim text-sm">//</span>
                        <span className="text-accent font-mono text-sm">SYSTEM</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/auth">
                            <Button variant="ghost">LOGIN</Button>
                        </Link>
                        <Link href="/auth?mode=register">
                            <Button>JOIN THE ELITE</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Pattern interrupt - corner brackets */}
                    <motion.div
                        className="absolute top-20 left-10 w-20 h-20 border-l-2 border-t-2 border-accent/30"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    />
                    <motion.div
                        className="absolute top-20 right-10 w-20 h-20 border-r-2 border-t-2 border-accent/30"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    />

                    <div className="text-center relative z-10">
                        {/* Label */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-4 py-2 rounded-full mb-8"
                        >
                            <Sparkles className="w-4 h-4 text-accent" />
                            <span className="text-sm font-medium text-accent">TACTICAL CHESS WARFARE</span>
                        </motion.div>

                        {/* Main headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="font-display text-7xl md:text-9xl tracking-tight mb-6"
                        >
                            DOMINATE
                            <br />
                            <span className="text-accent">THE BOARD</span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl text-foreground-muted max-w-2xl mx-auto mb-10"
                        >
                            Where grandmasters are forged. Real-time multiplayer chess with
                            ELO rankings, tactical analysis, and an elite community.
                        </motion.p>

                        {/* CTA buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link href="/auth">
                                <Button size="xl" className="group">
                                    <Swords className="w-5 h-5" />
                                    ENTER THE ARENA
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link href="/auth?guest=true">
                                <Button size="xl" variant="outline">
                                    QUICK MATCH AS GUEST
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Animated chess pieces background */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            className="absolute top-1/4 left-1/4 text-9xl opacity-5"
                            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                            transition={{ duration: 6, repeat: Infinity }}
                        >
                            ♔
                        </motion.div>
                        <motion.div
                            className="absolute top-1/3 right-1/4 text-8xl opacity-5"
                            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                            transition={{ duration: 8, repeat: Infinity }}
                        >
                            ♛
                        </motion.div>
                        <motion.div
                            className="absolute bottom-1/4 left-1/3 text-7xl opacity-5"
                            animate={{ y: [0, 15, 0] }}
                            transition={{ duration: 5, repeat: Infinity }}
                        >
                            ♞
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 border-t border-border">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="font-display text-5xl mb-4">ARSENAL</h2>
                        <p className="text-foreground-muted">Your weapons for domination</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Zap,
                                title: "BLITZ COMBAT",
                                description: "1-10 minute games. Think fast. Move faster.",
                            },
                            {
                                icon: Users,
                                title: "PLAY FRIENDS",
                                description: "Private rooms. Share code. Destroy rivals.",
                            },
                            {
                                icon: Bot,
                                title: "AI TRAINING",
                                description: "Stockfish-powered. 10 difficulty levels.",
                            },
                            {
                                icon: Trophy,
                                title: "ELO RANKING",
                                description: "Climb the ladder. Track your rise to elite.",
                            },
                            {
                                icon: Crown,
                                title: "MATCH ANALYSIS",
                                description: "Review every move. Learn from mistakes.",
                            },
                            {
                                icon: Swords,
                                title: "LIVE GAMES",
                                description: "Zero latency. Real-time moves.",
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group bg-background-card border border-border p-8 hover:border-accent/50 transition-all duration-300"
                            >
                                <feature.icon className="w-10 h-10 text-accent mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="font-display text-2xl mb-2">{feature.title}</h3>
                                <p className="text-foreground-muted text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6 bg-accent">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        {[
                            { value: "10,000+", label: "ACTIVE OPERATORS" },
                            { value: "1M+", label: "GAMES PLAYED" },
                            { value: "<50ms", label: "MOVE LATENCY" },
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="font-display text-5xl md:text-6xl text-white mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-white/70 text-sm tracking-widest">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-5xl mb-6">
                            READY TO <span className="text-accent">DOMINATE</span>?
                        </h2>
                        <p className="text-foreground-muted mb-8">
                            Join the elite. Every grandmaster started somewhere.
                        </p>
                        <Link href="/auth">
                            <Button size="xl" className="animate-pulse-glow">
                                <Crown className="w-5 h-5" />
                                CLAIM YOUR RANK
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-border">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-accent" />
                        <span className="font-display">ELITE CHESS SYSTEMS</span>
                    </div>
                    <p className="text-foreground-dim text-sm">
                        Forged in strategy. Built for the elite.
                    </p>
                </div>
            </footer>
        </div>
    );
}
