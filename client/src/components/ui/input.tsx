import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon, ...props }, ref) => {
        return (
            <div className="relative">
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full bg-background-secondary border border-border px-4 py-3 text-sm text-white placeholder:text-foreground-dim focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all disabled:cursor-not-allowed disabled:opacity-50",
                        icon && "pr-12",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {icon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-dim">
                        {icon}
                    </div>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
