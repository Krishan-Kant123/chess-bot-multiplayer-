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
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-1 md:gap-2">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-accent rounded flex items-center justify-center">
                            <Crown className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <span className="font-display text-base md:text-xl tracking-wider">ELITE CHESS</span>
                        <span className="hidden sm:inline text-foreground-dim text-sm">//</span>
                        <span className="hidden sm:inline text-accent font-mono text-sm">SYSTEM</span>
                    </Link>
                    <div className="flex items-center gap-2 md:gap-4">
                        <Link href="/auth">
                            <Button variant="ghost" size="sm" className="md:size-default text-xs md:text-sm">LOGIN</Button>
                        </Link>
                        <Link href="/auth?mode=register">
                            <Button size="sm" className="md:size-default text-xs md:text-sm">JOIN</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Pattern interrupt - corner brackets */}
                    <motion.div
                        className="hidden md:block absolute top-20 left-10 w-20 h-20 border-l-2 border-t-2 border-accent/30"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    />
                    <motion.div
                        className="hidden md:block absolute top-20 right-10 w-20 h-20 border-r-2 border-t-2 border-accent/30"
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
                            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-6 md:mb-8"
                        >
                            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-accent" />
                            <span className="text-xs md:text-sm font-medium text-accent">TACTICAL CHESS WARFARE</span>
                        </motion.div>

                        {/* Main headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-9xl tracking-tight mb-4 md:mb-6"
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
                            className="text-base md:text-xl text-foreground-muted max-w-2xl mx-auto mb-8 md:mb-10 px-4"
                        >
                            Where grandmasters are forged. Real-time multiplayer chess with
                            ELO rankings, tactical analysis, and an elite community.
                        </motion.p>

                        {/* CTA buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4"
                        >
                            <Link href="/auth" className="w-full sm:w-auto">
                                <Button size="lg" className="md:size-xl group w-full sm:w-auto">
                                    <Swords className="w-4 h-4 md:w-5 md:h-5" />
                                    ENTER THE ARENA
                                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link href="/auth?guest=true" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="md:size-xl w-full sm:w-auto">
                                    <span className="hidden sm:inline">QUICK MATCH AS GUEST</span>
                                    <span className="sm:hidden">GUEST MATCH</span>
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
            <section className="py-12 md:py-20 px-4 md:px-6 border-t border-border">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-10 md:mb-16"
                    >
                        <h2 className="font-display text-3xl md:text-5xl mb-3 md:mb-4">ARSENAL</h2>
                        <p className="text-sm md:text-base text-foreground-muted">Your weapons for domination</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                                className="group bg-background-card border border-border p-5 md:p-8 hover:border-accent/50 transition-all duration-300"
                            >
                                <feature.icon className="w-8 h-8 md:w-10 md:h-10 text-accent mb-3 md:mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="font-display text-lg md:text-2xl mb-2">{feature.title}</h3>
                                <p className="text-foreground-muted text-xs md:text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 md:py-20 px-4 md:px-6 bg-accent">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
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
                                <div className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-1 md:mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-white/70 text-xs md:text-sm tracking-wider md:tracking-widest">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 md:py-20 px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-3xl md:text-5xl mb-4 md:mb-6">
                            READY TO <span className="text-accent">DOMINATE</span>?
                        </h2>
                        <p className="text-sm md:text-base text-foreground-muted mb-6 md:mb-8">
                            Join the elite. Every grandmaster started somewhere.
                        </p>
                        <Link href="/auth">
                            <Button size="lg" className="md:size-xl animate-pulse-glow">
                                <Crown className="w-4 h-4 md:w-5 md:h-5" />
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
