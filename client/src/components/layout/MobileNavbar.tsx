"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
    Crown,
    Swords,
    History,
    User,
    LogOut,
    Menu,
    X,
} from "lucide-react";

const navItems = [
    { name: "DASHBOARD", href: "/dashboard", icon: Crown },
    { name: "PLAY", href: "/play", icon: Swords },
    { name: "HISTORY", href: "/history", icon: History },
    { name: "PROFILE", href: "/profile", icon: User },
];

export function MobileNavbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-background-secondary border-b border-border z-50">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display text-xl">CHESS ELITE</span>
                    </div>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 hover:bg-white/5 rounded transition-colors"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/60 z-40"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="md:hidden fixed top-14 right-0 bottom-0 w-64 bg-background-secondary border-l border-border z-50 overflow-y-auto"
                        >
                            <div className="p-4">
                                {/* User Info */}
                                <div className="mb-6 pb-6 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {user?.username?.slice(0, 2).toUpperCase() || "G"}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white">
                                                {user?.username || "Guest"}
                                            </div>
                                            <div className="text-sm text-foreground-dim">
                                                Rating: {user?.rating || 1200}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <nav className="space-y-2">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${isActive
                                                    ? "bg-accent text-white"
                                                    : "text-foreground-muted hover:bg-white/5 hover:text-white"
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="font-semibold">{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* Logout */}
                                <div className="mt-6 pt-6 border-t border-border">
                                    <Button
                                        onClick={() => {
                                            logout();
                                            setIsOpen(false);
                                        }}
                                        variant="secondary"
                                        className="w-full"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        LOGOUT
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-border z-50">
                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded transition-colors ${isActive ? "text-accent" : "text-foreground-muted"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-semibold">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
