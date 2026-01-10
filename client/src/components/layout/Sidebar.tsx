"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    LayoutDashboard,
    Swords,
    Puzzle,
    GraduationCap,
    Eye,
    LogOut,
    Crown,
    ChevronRight,
} from "lucide-react";

const navItems = [
    { icon: LayoutDashboard, label: "DASHBOARD", href: "/dashboard" },
    { icon: Swords, label: "PLAY", href: "/play" },
    { icon: Puzzle, label: "PUZZLES", href: "/puzzles", disabled: true },
    { icon: GraduationCap, label: "LEARN", href: "/learn", disabled: true },
    { icon: Eye, label: "WATCH", href: "/watch", disabled: true },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout, isGuest } = useAuth();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-background-secondary border-r border-border flex flex-col z-40">
            {/* User Profile */}
            <div className="p-4 border-b border-border">
                <Link href="/profile" className="flex items-center gap-3 group">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src="/avatar-placeholder.png" />
                        <AvatarFallback>
                            {user?.username?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate">
                                {user?.username || "Unknown"}
                            </span>
                            <ChevronRight className="w-4 h-4 text-foreground-dim group-hover:text-accent transition-colors" />
                        </div>
                        <span className="text-xs text-accent uppercase tracking-wider">
                            {isGuest ? "GUEST" : "ELITE TIER"}
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.disabled ? "#" : item.href}
                            className={cn(
                                "sidebar-item relative",
                                isActive && "sidebar-item-active",
                                item.disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <item.icon className={cn(
                                "w-5 h-5",
                                isActive ? "text-accent" : "text-foreground-muted"
                            )} />
                            <span className={isActive ? "text-white" : ""}>
                                {item.label}
                            </span>
                            {item.disabled && (
                                <span className="ml-auto text-[10px] bg-foreground-dim/20 px-2 py-0.5 rounded text-foreground-dim">
                                    SOON
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Season Banner */}
            <div className="mx-4 mb-4">
                <div className="bg-accent/10 border border-accent/30 p-3 rounded">
                    <span className="text-[10px] text-foreground-dim uppercase tracking-wider">
                        CURRENT SEASON
                    </span>
                    <div className="font-display text-lg text-accent mt-1">
                        WINTER WARFARE
                    </div>
                </div>
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-border">
                <button
                    onClick={logout}
                    className="sidebar-item w-full hover:text-accent"
                >
                    <LogOut className="w-5 h-5" />
                    <span>LOG OUT</span>
                </button>
            </div>
        </aside>
    );
}
