import React, { useState } from 'react';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
    error?: string;
}

export default function InputGroup({ label, icon, error, type = "text", className = "", ...props }: InputGroupProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className={`mb-3 ${className}`}>
            <label className="block text-xs font-bold text-slate-300 mb-1">
                {label}
            </label>
            <div className="relative rounded-xl shadow-sm group">

                {/* Icon Left */}
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        {icon}
                    </div>
                )}

                <input
                    type={inputType}
                    suppressHydrationWarning
                    className={`
            block w-full rounded-xl border-white/10 bg-white/5 text-sm
            ${icon ? "pl-10" : "pl-4"} 
            ${isPassword ? "pr-10" : "pr-4"}
            py-2.5 text-white placeholder:text-slate-500
            focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0 transition-all duration-200
            ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
          `}
                    {...props}
                />

                {/* Password Toggle Right */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                        {showPassword ? (
                            // Eye Off Icon
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745A10.031 10.031 0 0018 10c-1.63 4.39-4.8 7.33-8 7.33a9.9 9.9 0 00-5.32-1.571L3.28 2.22zM2.87 11.43c-.45-.9-.77-1.85-.92-2.82C3.15 4.61 6.55 2.67 10 2.67c1.76 0 3.39.46 4.79 1.25L10.23 8.48A4.018 4.018 0 005.8 11.23l-2.93.2z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            // Eye Icon
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
