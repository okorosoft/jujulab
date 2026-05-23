"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useCallback } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Play,
    CheckCircle2,
    RotateCcw,
    Lightbulb,
    Terminal,
    Trophy,
    Loader2,
    AlertCircle,
    Clock,
    Code
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { CodeEditor } from '@/components/coding/code-editor';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface TestSelection {
    input: string;
    output: string;
    description: string;
    status: 'pending' | 'success' | 'fail';
}

export default function ChallengeDetailPage() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const { id } = useParams();
    const [challenge, setChallenge] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'tests' | 'solution'>('problem');

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.href = '/';
        }
    }, [isLoaded, isSignedIn]);

    const fetchChallenge = useCallback(async () => {
        try {
            const res = await fetch(`/api/coding/practice/challenge/${id}`);
            if (res.ok) {
                const data = await res.json();
                setChallenge(data);
                setCode(data.codeTemplate);
            } else {
                router.push('/dashboard/coding/practice');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (isSignedIn && id) {
            fetchChallenge();
        }
    }, [isSignedIn, id, fetchChallenge]);

    const handleSubmit = async () => {
        if (!code.trim()) return;
        setIsRunning(true);
        setOutput('Validating solution against test cases...');

        try {
            const res = await fetch(`/api/coding/practice/challenge/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();
            setOutput(data.output);

            if (res.ok) {
                toast.success('Congratulations! Challenge AC!', {
                    icon: <Trophy className="w-5 h-5 text-yellow-400" />
                });
                setChallenge({ ...challenge, completed: true });
            }
        } catch (error) {
            setOutput('Error: Validation failed.');
        } finally {
            setIsRunning(false);
        }
    };

    if (!isLoaded || !isSignedIn || isLoading) {
        return (
            <>
                <DashboardSidebar />
                <SkeletonPage type="ai-humanize" />
            </>
        );
    }

    if (!challenge) return null;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col h-screen overflow-hidden">
            <DashboardSidebar />

            <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
                {/* Workspace Header */}
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black shrink-0">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/dashboard/coding/practice/folder/${challenge.folderId}`}
                            className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-500 hover:text-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="h-4 w-px bg-white/10 mx-2" />
                        <h1 className="font-black text-sm tracking-widest uppercase truncate max-w-[300px]">{challenge.title}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500 mr-4">
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {challenge.timeLimit}</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className="text-emerald-400">{challenge.points} XP</span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isRunning}
                            className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                            Submit
                        </button>
                    </div>
                </header>

                {/* Main Interface */}
                <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

                    {/* Description Column */}
                    <div className="w-full lg:w-[500px] border-r border-white/10 flex flex-col bg-[#050505] shrink-0">
                        <div className="h-12 border-b border-white/10 flex shrink-0">
                            {['problem', 'tests', 'solution'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`flex-1 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                            ? 'bg-white/5 text-white border-b-2 border-orange-500'
                                            : 'text-gray-600 hover:text-gray-400'
                                        }`}
                                >
                                    {tab === 'problem' ? 'Statement' : tab === 'tests' ? 'Tests' : 'My Solution'}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {activeTab === 'problem' && (
                                <div className="prose prose-invert prose-orange max-w-none">
                                    <ReactMarkdown>{challenge.description}</ReactMarkdown>
                                </div>
                            )}

                            {activeTab === 'tests' && (
                                <div className="space-y-6">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-orange-400 mb-6 flex items-center gap-2">
                                        <Terminal className="w-4 h-4" />
                                        Test Harness
                                    </h2>
                                    <div className="space-y-4">
                                        {challenge.testCases.map((tc: any, i: number) => (
                                            <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl group">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{tc.description || `TC #${i + 1}`}</span>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                                                    <div>
                                                        <div className="text-gray-600 mb-1 font-bold tracking-tight uppercase [font-size:8px]">Input</div>
                                                        <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-gray-300 truncate">{tc.input}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-600 mb-1 font-bold tracking-tight uppercase [font-size:8px]">Expect</div>
                                                        <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-emerald-400/80 truncate font-bold">{tc.output}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'solution' && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                                        <Code className="w-8 h-8 text-gray-700" />
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium mb-4">Your final submitted solution will be archived here after graduation.</p>
                                    {challenge.completed && (
                                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                            Challenge Mastered
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor Column */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#080808]">
                        <div className="flex-1 flex flex-col min-h-0 relative">
                            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-black/40">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5 grayscale opacity-50">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">main.{challenge.language.toLowerCase()}</span>
                                </div>
                                <button
                                    onClick={() => setCode(challenge.codeTemplate)}
                                    className="text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3 h-3" /> Reset Stub
                                </button>
                            </div>
                            <div className="flex-1 bg-[#1e1e1e]">
                                <CodeEditor
                                    language={challenge.language}
                                    value={code}
                                    onChange={setCode}
                                    height="100%"
                                />
                            </div>
                        </div>

                        {/* Terminal Column */}
                        <div className="h-1/3 min-h-[250px] border-t border-white/10 flex flex-col shrink-0 bg-[#020202]">
                            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4">
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                    <Terminal className="w-3.5 h-3.5" /> Terminal session
                                </span>
                                <button
                                    onClick={() => setOutput('')}
                                    className="text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-widest transition-colors"
                                >
                                    Flush Log
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 font-mono text-[13px] custom-scrollbar">
                                {output ? (
                                    <div className="space-y-4">
                                        <div className="text-gray-400 flex gap-2">
                                            <span className="text-emerald-500">$</span>
                                            <span>./run_tests --challenge={id}</span>
                                        </div>
                                        <div className={`whitespace-pre-wrap leading-relaxed ${output.includes('Error') ? 'text-red-400' : 'text-emerald-400/90'}`}>
                                            {output}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-800 italic animate-pulse">Awaiting submission signal...</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
