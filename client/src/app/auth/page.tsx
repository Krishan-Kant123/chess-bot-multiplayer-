"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GuestLogin } from "@/components/auth/GuestLogin";
import { Crown, Eye } from "lucide-react";

function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, register, loginAsGuest, isAuthenticated } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (searchParams.get("mode") === "register") {
            setIsLogin(false);
        }
    }, [searchParams]);

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    const handleLogin = async (email: string, password: string) => {
        setError("");
        setIsLoading(true);
        const result = await login(email, password);
        if (!result.success) {
            setError(result.error || "Authentication failed");
        }
        setIsLoading(false);
    };

    const handleRegister = async (username: string, email: string, password: string) => {
        setError("");
        setIsLoading(true);
        const result = await register(username, email, password);
        if (!result.success) {
            setError(result.error || "Registration failed");
        }
        setIsLoading(false);
    };

    const handleGuestLogin = (username: string) => {
        loginAsGuest(username);
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Member Access */}
            <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-md mx-auto w-full"
                >
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center gap-2 mb-12">
                        <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                    </Link>

                    {/* Header */}
                    <h1 className="font-display text-4xl text-black mb-2">
                        MEMBER
                        <br />
                        ACCESS
                    </h1>
                    <p className="text-gray-500 text-sm tracking-widest mb-8">
                        SECURE TERMINAL // ENTER CREDENTIALS
                    </p>

                    {/* Toggle */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${isLogin
                                ? "text-black border-black"
                                : "text-gray-400 border-transparent hover:text-gray-600"
                                }`}
                        >
                            LOGIN
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${!isLogin
                                ? "text-black border-black"
                                : "text-gray-400 border-transparent hover:text-gray-600"
                                }`}
                        >
                            REGISTER
                        </button>
                    </div>

                    {/* Form */}
                    {isLogin ? (
                        <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
                    ) : (
                        <RegisterForm onSubmit={handleRegister} isLoading={isLoading} error={error} />
                    )}

                    <div className="mt-6 flex items-center justify-between">
                        <button className="text-xs text-gray-500 hover:text-black underline">
                            FORGOT CREDENTIALS?
                        </button>
                        <span className="text-xs text-gray-400">V.2.0.4</span>
                    </div>

                    {/* Bottom bar */}
                    <div className="mt-12 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            NEW TO THE CLUB?{" "}
                            <button
                                onClick={() => setIsLogin(false)}
                                className="text-accent hover:underline font-medium"
                            >
                                SIGN UP NOW
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Panel - Visitor Pass (Guest) */}
            <div className="flex-1 bg-accent p-8 md:p-16 flex flex-col justify-center relative overflow-hidden">
                {/* Decorative background shapes */}
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/20 transform rotate-45" />
                <div className="absolute bottom-20 right-20 w-32 h-32 bg-red-500/30 transform rotate-45" />

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-md mx-auto w-full relative z-10"
                >
                    {/* Icon */}
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-8">
                        <Eye className="w-8 h-8 text-white" />
                    </div>

                    {/* Header */}
                    <h2 className="font-display text-5xl text-white italic mb-4">
                        VISITOR
                        <br />
                        PASS
                    </h2>

                    {/* Description */}
                    <div className="flex items-start gap-2 mb-8">
                        <div className="w-1 h-16 bg-white/50" />
                        <p className="text-white/80">
                            Spectator mode enabled. No credentials required for limited access.
                        </p>
                    </div>

                    {/* Guest login */}
                    <GuestLogin onLogin={handleGuestLogin} />
                </motion.div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthContent />
        </Suspense>
    );
}
