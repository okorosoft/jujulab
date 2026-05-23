"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Plus,
    Search,
    Filter,
    Clock,
    Trophy,
    Trash2,
    ChevronRight,
    Loader2,
    X,
    Sparkles,
    CheckCircle2,
    RotateCcw
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Lesson {
    _id: string;
    title: string;
    description: string;
    language: string;
    difficulty: string;
    duration: string;
    completed: boolean;
    progress: number;
}

export default function LessonsPage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        topic: '',
        language: 'Python',
        difficulty: 'Easy',
        objectives: '',
        duration: '15 min',
    });

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.href = '/';
        }
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (isSignedIn) {
            fetchLessons();
        }
    }, [isSignedIn]);

    const fetchLessons = async () => {
        try {
            const response = await fetch('/api/coding/lessons/list');
            if (response.ok) {
                const data = await response.json();
                setLessons(data.lessons || []);
            }
        } catch (error) {
            console.error('Error fetching lessons:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const response = await fetch('/api/coding/lessons/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate lesson');
            }

            const data = await response.json();
            toast.success('AI Lesson generated successfully!');
            setShowModal(false);
            fetchLessons();
            // Optionally redirect to the new lesson
            router.push(`/dashboard/coding/lessons/${data.lessonId}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to generate lesson');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this lesson?')) return;

        try {
            const response = await fetch(`/api/coding/lessons/delete?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setLessons(lessons.filter(l => l._id !== id));
                toast.success('Lesson deleted');
            }
        } catch (error) {
            toast.error('Failed to delete lesson');
        }
    };

    const filteredLessons = lessons.filter(lesson => {
        const matchesFilter = filter === 'All' || lesson.difficulty === filter;
        const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.language.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (!isLoaded || !isSignedIn) {
        return (
            <>
                <DashboardSidebar />
                <SkeletonPage type="ai-humanize" />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <DashboardSidebar />

            <div className="lg:pl-64 pt-16 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <BookOpen className="w-10 h-10 text-emerald-400" />
                                AI Coding Lessons
                            </h1>
                            <p className="text-gray-400">
                                Master programming with personalized, AI-generated curriculum and hands-on exercises.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg shadow-white/5"
                        >
                            <Plus className="w-5 h-5" />
                            Generate New Lesson
                        </button>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            { label: 'Lessons Completed', value: lessons.filter(l => l.completed).length, icon: CheckCircle2, color: 'text-emerald-400' },
                            { label: 'Total Practice Time', value: '~' + (lessons.length * 15) + 'm', icon: Clock, color: 'text-blue-400' },
                            { label: 'Mastery Level', value: 'Level 1', icon: Trophy, color: 'text-yellow-400' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
                            </div>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search lessons by title or language..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                            />
                        </div>
                        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                            {['All', 'Easy', 'Medium', 'Hard'].map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setFilter(lvl)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === lvl ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lessons list */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                            <p className="text-gray-400 font-medium">Loading your curriculum...</p>
                        </div>
                    ) : filteredLessons.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredLessons.map((lesson, i) => (
                                <motion.div
                                    key={lesson._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => router.push(`/dashboard/coding/lessons/${lesson._id}`)}
                                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                {lesson.language}
                                            </span>
                                            <span className={`px-2 py-1 border text-[10px] font-bold uppercase tracking-wider rounded-md ${lesson.difficulty === 'Easy' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                lesson.difficulty === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                                    'bg-red-500/10 border-red-500/30 text-red-400'
                                                }`}>
                                                {lesson.difficulty}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteLesson(lesson._id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all text-gray-500 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">
                                        {lesson.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                                        {lesson.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {lesson.duration}
                                            </span>
                                            {lesson.completed ? (
                                                <span className="flex items-center gap-1.5 text-emerald-400">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Completed
                                                </span>
                                            ) : lesson.progress > 0 ? (
                                                <span className="text-blue-400">{lesson.progress}% progress</span>
                                            ) : (
                                                <span>Not started</span>
                                            )}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                    </div>

                                    {/* Progress Line */}
                                    {lesson.progress > 0 && (
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                                            <div className="h-full bg-emerald-500" style={{ width: `${lesson.progress}%` }} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl py-24 flex flex-col items-center text-center px-6">
                            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                                <BookOpen className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">No lessons yet</h3>
                            <p className="text-gray-400 max-w-sm mb-10">
                                You haven&apos;t generated any AI lessons yet. Let&apos;s create your first personalized coding path!
                            </p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Create First Lesson
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Generation Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => !isCreating && setShowModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                                        <Sparkles className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Generate AI Lesson</h2>
                                        <p className="text-sm text-gray-500">Customize your learning experience</p>
                                    </div>
                                </div>
                                {!isCreating && (
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                        <X className="w-6 h-6 text-gray-500" />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleCreateLesson} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-400">Lesson Topic</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Async/Await in JavaScript, React Hooks, Python Data Structures"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium"
                                            value={formData.topic}
                                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Programming Language</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium appearance-none cursor-pointer"
                                            value={formData.language}
                                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                            disabled={isCreating}
                                        >
                                            {['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby'].map(l => (
                                                <option key={l} value={l} className="bg-black text-white">{l}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Difficulty</label>
                                        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                                            {['Easy', 'Medium', 'Hard'].map(lvl => (
                                                <button
                                                    key={lvl}
                                                    type="button"
                                                    disabled={isCreating}
                                                    onClick={() => setFormData({ ...formData, difficulty: lvl })}
                                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${formData.difficulty === lvl ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                                                >
                                                    {lvl}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Learning Objectives</label>
                                    <textarea
                                        required
                                        placeholder="What do you want to learn? (e.g. Understand the event loop, How to use map/filter/reduce, Practice class inheritance)"
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium resize-none"
                                        value={formData.objectives}
                                        onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                                        disabled={isCreating}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500 font-medium bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <RotateCcw className="w-3 h-3 text-emerald-400" />
                                        <span>Cost: 2,000 Credits</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-emerald-400" />
                                        <span>Time to generate: ~30s</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-xl shadow-white/5 mt-4"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Generating Curriculum...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            <span>Generate Lesson</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
