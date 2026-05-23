"use client";

import React from 'react';

interface LanguageSelectorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    label,
    value,
    onChange,
    options,
}) => {
    return (
        <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-400">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer"
                >
                    {options.map((option) => (
                        <option key={option} value={option} className="bg-gray-900 text-white">
                            {option}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};
