import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
    if (seconds < 0) return "∞";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
}

export function formatRating(rating: number): string {
    return rating.toLocaleString();
}

export function getRatingChangeColor(change: number): string {
    if (change > 0) return "text-success";
    if (change < 0) return "text-accent";
    return "text-foreground-muted";
}

export function getResultColor(result: "win" | "loss" | "draw"): string {
    switch (result) {
        case "win":
            return "text-success";
        case "loss":
            return "text-accent";
        case "draw":
            return "text-foreground-muted";
    }
}

export function getResultLabel(result: "win" | "loss" | "draw"): string {
    return result.toUpperCase();
}

export function truncateUsername(username: string, maxLength = 15): string {
    if (username.length <= maxLength) return username;
    return username.slice(0, maxLength - 2) + "..";
}
