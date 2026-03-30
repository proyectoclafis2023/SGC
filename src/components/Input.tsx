import React, { type InputHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                        {label}
                    </label>
                )}
                <input
                    className={cn(
                        "flex h-11 w-full rounded-xl border transition-all duration-200 text-sm",
                        "bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700",
                        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500",
                        "disabled:cursor-not-allowed disabled:opacity-50 shadow-sm backdrop-blur-sm",
                        error && "border-red-500 focus-visible:ring-red-500/10 focus-visible:border-red-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && <p className="text-xs text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";
