"use client";

import  Sidebar  from "@/components/layout/Sidebar";
import { MobileNavbar } from "@/components/layout/MobileNavbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Mobile Navbar */}
            <MobileNavbar />

            {/* Main Content */}
            <main className="flex-1 md:ml-64 pt-14 pb-16 md:pt-0 md:pb-0">
                {children}
            </main>
        </div>
    );
}
