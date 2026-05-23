"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import {
    Code2,
    Zap,
    Copy,
    Download,
    RotateCcw,
    Languages,
    ArrowRightLeft,
    Loader2,
    Check
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { trackToolUsage } from '@/lib/tool-usage-tracker';
import { saveDocument } from '@/lib/save-document';
import { CodeEditor } from '@/components/coding/code-editor';
import { LanguageSelector } from '@/components/coding/language-selector';
import { toast } from 'sonner';

const languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
    'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Lua', 'Dart', 'Elixir', 'Haskell',
    'Assembly Language', 'Clojure', 'CoffeeScript', 'CSS', 'Fortran', 'Groovy',
    'HTML', 'Julia', 'Lisp', 'Objective-C', 'Pascal', 'PL/SQL', 'PowerShell', 'Prolog',
    'Racket', 'SAS', 'Shell', 'SQL', 'Visual Basic', 'XML'
];

export default function CodeTranslatorPage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [sourceCode, setSourceCode] = useState('');
    const [translatedCode, setTranslatedCode] = useState('');
    const [fromLang, setFromLang] = useState('JavaScript');
    const [toLang, setToLang] = useState('Python');
    const [isTranslating, setIsTranslating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.href = '/';
        }
    }, [isLoaded, isSignedIn]);

    const handleTranslate = async () => {
        if (!sourceCode.trim()) return;

        setIsTranslating(true);
        setError(null);
        setTranslatedCode('');

        try {
            const response = await fetch('/api/coding/translator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inputLanguage: fromLang,
                    outputLanguage: toLang,
                    inputCode: sourceCode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Translation failed');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let result = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    result += chunk;
                    setTranslatedCode(result);
                }
            }

            // Track usage
            trackToolUsage('code-translator', 'AI Code Translator', 0);

            // Save document
            await saveDocument({
                type: 'code-translator',
                title: `Code Translation: ${fromLang} to ${toLang}`,
                input: sourceCode,
                output: result,
                wordCount: 0,
                toolMetadata: {
                    fromLang,
                    toLang,
                    charactersConverted: sourceCode.length
                }
            });

        } catch (err: any) {
            setError(err.message || 'An error occurred during translation');
            toast.error(err.message || 'Translation failed');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleCopy = () => {
        if (!translatedCode) return;
        navigator.clipboard.writeText(translatedCode);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!translatedCode) return;
        const blob = new Blob([translatedCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_code.${toLang.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSwap = () => {
        const tempLang = fromLang;
        setFromLang(toLang);
        setToLang(tempLang);
        const tempCode = sourceCode;
        setSourceCode(translatedCode);
        setTranslatedCode(tempCode);
    };

    if (!isLoaded || !isSignedIn) {
        return (
            <>
                <DashboardSidebar />
                <SkeletonPage type="ai-humanize" />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <DashboardSidebar />

            <div className="lg:pl-64 pt-16 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Code2 className="w-8 h-8 text-blue-400" />
                            AI Code Translator
                        </h1>
                        <p className="text-gray-400">
                            Instantly translate code between 40+ programming languages with high precision and idomatic patterns.
                        </p>
                    </div>

                    {/* Configuration Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10"
                    >
                        <div className="flex flex-col md:flex-row items-end gap-6">
                            <div className="flex-1 w-full">
                                <LanguageSelector
                                    label="From Language"
                                    value={fromLang}
                                    onChange={setFromLang}
                                    options={languages}
                                />
                            </div>

                            <button
                                onClick={handleSwap}
                                className="mb-1 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white"
                            >
                                <ArrowRightLeft className="w-5 h-5" />
                            </button>

                            <div className="flex-1 w-full">
                                <LanguageSelector
                                    label="To Language"
                                    value={toLang}
                                    onChange={setToLang}
                                    options={languages}
                                />
                            </div>

                            <button
                                onClick={handleTranslate}
                                disabled={isTranslating || !sourceCode.trim()}
                                className="w-full md:w-auto mb-1 flex items-center justify-center gap-2 px-8 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-white/5"
                            >
                                {isTranslating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Translating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5" />
                                        <span>Translate Code</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Editors Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Input Editor */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{fromLang} Source</span>
                                <button
                                    onClick={() => setSourceCode('')}
                                    className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Clear
                                </button>
                            </div>
                            <CodeEditor
                                value={sourceCode}
                                onChange={setSourceCode}
                                language={fromLang}
                                height="500px"
                                placeholder={`// Paste your ${fromLang} code here...`}
                            />
                        </motion.div>

                        {/* Output Editor */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{toLang} Result</span>
                                <div className="flex bg-white/5 rounded-lg border border-white/10">
                                    <button
                                        onClick={handleCopy}
                                        disabled={!translatedCode}
                                        className="p-2 border-r border-white/10 hover:bg-white/10 transition-colors text-white disabled:opacity-30"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        disabled={!translatedCode}
                                        className="p-2 hover:bg-white/10 transition-colors text-white disabled:opacity-30"
                                        title="Download file"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <CodeEditor
                                value={translatedCode}
                                readOnly
                                language={toLang}
                                height="500px"
                                placeholder="Translated code will appear here..."
                            />
                        </motion.div>
                    </div>

                    {/* Bottom Info */}
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
                            <Zap className="w-3 h-3" />
                            Powered by GPT-4 and GPT-4o for maximum accuracy
                        </div>
                        <p className="text-xs text-gray-600">
                            Marketplace ID: code-translator • Cost: 1 character per credit
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
