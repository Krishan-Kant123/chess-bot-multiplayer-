import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
    title: "ELITE CHESS // SYSTEM",
    description: "Forged in strategy. Built for the elite. Analyze, Adapt, Dominate.",
    keywords: ["chess", "online chess", "multiplayer", "strategy", "elite"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-background antialiased">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
