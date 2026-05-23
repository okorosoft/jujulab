"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useCallback } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    Play,
    CheckCircle2,
    RotateCcw,
    Lightbulb,
    Terminal,
    BookOpen,
    Loader2,
    Trophy
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { CodeEditor } from '@/components/coding/code-editor';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Lesson {
    _id: string;
    title: string;
    description: string;
    language: string;
    difficulty: string;
    duration: string;
    content: string;
    codeTemplate: string;
    expectedOutput: string;
    hints: string[];
    completed: boolean;
    progress: number;
    currentCode?: string;
}

export default function LessonDetailPage() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const { id } = useParams();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [activeTab, setActiveTab] = useState<'instructions' | 'output'>('instructions');

    const fetchLesson = useCallback(async () => {
        try {
            const response = await fetch(`/api/coding/lessons/${id}`);
            if (response.ok) {
                const data = await response.json();
                setLesson(data.lesson);
                setCode(data.lesson.currentCode || data.lesson.codeTemplate);
            } else {
                toast.error('Failed to load lesson');
                router.push('/dashboard/coding/lessons');
            }
        } catch (error) {
            console.error('Error fetching lesson:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.href = '/';
        }
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (isSignedIn && id) {
            fetchLesson();
        }
    }, [isSignedIn, id, fetchLesson]);

    const handleRunCode = async () => {
        if (!code.trim()) return;

        setIsRunning(true);
        setOutput('Compiling and running...');

        try {
            const response = await fetch(`/api/coding/lessons/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) throw new Error('Failed to run code');

            const data = await response.json();
            setOutput(data.output);

            if (data.completed) {
                toast.success('Congratulations! Lesson completed!', {
                    icon: <Trophy className="w-5 h-5 text-yellow-400" />,
                });
                setLesson(prev => prev ? { ...prev, completed: true, progress: 100 } : null);
            } else {
                toast.info('Code executed. Check the output!');
            }
        } catch (error) {
            setOutput('Error: Execution failed. Please try again.');
        } finally {
            setIsRunning(false);
        }
    };

    const resetCode = () => {
        if (lesson && confirm('Reset code to original template?')) {
            setCode(lesson.codeTemplate);
            toast.success('Code reset');
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

    if (!lesson) return null;

    return (
        <div className="min-h-screen bg-black text-white">
            <DashboardSidebar />

            <div className="lg:pl-64 h-screen flex flex-col">
                {/* Top Header */}
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/coding/lessons"
                            className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <div>
                            <h1 className="font-bold text-lg leading-none mb-1">{lesson.title}</h1>
                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                <span className="text-emerald-400">{lesson.language}</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className={
                                    lesson.difficulty === 'Easy' ? 'text-blue-400' :
                                        lesson.difficulty === 'Medium' ? 'text-yellow-400' :
                                            'text-red-400'
                                }>{lesson.difficulty}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {lesson.completed && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Completed
                            </div>
                        )}
                        <button
                            onClick={handleRunCode}
                            disabled={isRunning || !code.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg shadow-white/5 disabled:opacity-50 shrink-0"
                        >
                            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                            Run Code
                        </button>
                    </div>
                </header>

                {/* Main Workspace */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

                    {/* Instructions Panel */}
                    <div className="w-full lg:w-[450px] xl:w-[550px] border-r border-white/10 flex flex-col bg-[#050505] shrink-0">
                        <div className="h-12 flex border-b border-white/10 bg-black/20 shrink-0">
                            <button
                                onClick={() => setActiveTab('instructions')}
                                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'instructions' ? 'bg-white/5 text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <BookOpen className="w-4 h-4" />
                                Instructions
                            </button>
                            <button
                                onClick={() => setActiveTab('output')}
                                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'output' ? 'bg-white/5 text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Terminal className="w-4 h-4" />
                                Expected
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {activeTab === 'instructions' ? (
                                <div className="prose prose-invert prose-emerald max-w-none">
                                    <ReactMarkdown>{lesson.content}</ReactMarkdown>

                                    {lesson.hints && lesson.hints.length > 0 && (
                                        <div className="mt-12 pt-8 border-t border-white/10">
                                            <button
                                                onClick={() => setShowHints(!showHints)}
                                                className="flex items-center gap-2 text-sm font-bold text-yellow-400 hover:text-yellow-300 transition-all uppercase tracking-wider"
                                            >
                                                <Lightbulb className="w-4 h-4" />
                                                {showHints ? 'Hide Hints' : 'Confused? Reveal Hints'}
                                            </button>

                                            {showHints && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-4 space-y-4"
                                                >
                                                    {lesson.hints.map((hint, i) => (
                                                        <div key={i} className="p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-yellow-200/80 text-sm leading-relaxed">
                                                            {hint}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Pass Criteria
                                        </h3>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                            Your code should produce the following output after execution:
                                        </p>
                                        <pre className="bg-black/50 p-6 rounded-xl border border-white/5 font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                            {lesson.expectedOutput}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor & Console Panel */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
                        {/* Editor Area */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-black/20">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
                                    Editor: main.{lesson.language.toLowerCase()}
                                </span>
                                <button
                                    onClick={resetCode}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-white transition-all uppercase tracking-widest"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset
                                </button>
                            </div>
                            <div className="flex-1 bg-[#1e1e1e]">
                                <CodeEditor
                                    value={code}
                                    onChange={setCode}
                                    language={lesson.language}
                                    height="100%"
                                />
                            </div>
                        </div>

                        {/* Console Area */}
                        <div className="h-1/3 min-h-[200px] border-t border-white/10 flex flex-col shrink-0 bg-[#050505]">
                            <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Terminal className="w-3 h-3" />
                                    Console Output
                                </span>
                                <button
                                    onClick={() => setOutput('')}
                                    className="text-[10px] font-bold text-gray-500 hover:text-white transition-all uppercase tracking-widest"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm custom-scrollbar">
                                {output ? (
                                    <div className={`whitespace-pre-wrap ${output.startsWith('Error') ? 'text-red-400' : 'text-gray-300'}`}>
                                        {output}
                                    </div>
                                ) : (
                                    <div className="text-gray-600 italic">No output yet. Click &apos;Run Code&apos; to execute.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
