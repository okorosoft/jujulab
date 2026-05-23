"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dumbbell,
    Plus,
    Folder,
    Trash2,
    ChevronRight,
    Loader2,
    X,
    Sparkles,
    Search,
    BookOpen,
    Trophy,
    MoreVertical,
    PlusCircle
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Folder {
    _id: string;
    name: string;
    count?: number;
}

export default function PracticePage() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const [formData, setFormData] = useState({
        folderId: '',
        topic: '',
        numberOfQuestions: 1,
        difficulty: 'Medium',
        role: 'Full Stack Developer',
    });

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.href = '/';
        }
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (isSignedIn) {
            fetchData();
        }
    }, [isSignedIn]);

    const fetchData = async () => {
        try {
            const [foldersRes, challengesRes] = await Promise.all([
                fetch('/api/coding/practice/folders'),
                fetch('/api/coding/practice/list')
            ]);

            if (foldersRes.ok && challengesRes.ok) {
                const foldersData = await foldersRes.json();
                const challengesData = await challengesRes.json();

                const foldersWithCount = foldersData.map((f: any) => ({
                    ...f,
                    count: challengesData.filter((c: any) => c.folderId === f._id).length
                }));

                setFolders(foldersWithCount);
                setChallenges(challengesData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            const response = await fetch('/api/coding/practice/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName }),
            });

            if (response.ok) {
                const folder = await response.json();
                setFolders([{ ...folder, count: 0 }, ...folders]);
                setFormData({ ...formData, folderId: folder._id });
                setNewFolderName('');
                setShowFolderModal(false);
                toast.success('Folder created');
            }
        } catch (error) {
            toast.error('Failed to create folder');
        }
    };

    const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this folder and all challenges inside?')) return;

        try {
            const response = await fetch(`/api/coding/practice/folders?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setFolders(folders.filter(f => f._id !== id));
                toast.success('Folder deleted');
            }
        } catch (error) {
            toast.error('Failed to delete folder');
        }
    };

    const handleGeneratePractice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.folderId || !formData.topic) return;

        setIsCreating(true);
        try {
            const response = await fetch('/api/coding/practice/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate practice');
            }

            toast.success('Practice generated successfully!');
            setShowModal(false);
            fetchData();
            router.push(`/dashboard/coding/practice/folder/${formData.folderId}`);
        } catch (error: any) {
            toast.error(error.message || 'Generation failed');
        } finally {
            setIsCreating(false);
        }
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
        <div className="min-h-screen bg-black text-white">
            <DashboardSidebar />

            <div className="lg:pl-64 pt-16 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <Dumbbell className="w-10 h-10 text-orange-400" />
                                AI Coding Practice
                            </h1>
                            <p className="text-gray-400 font-medium">
                                Sharpen your skills with AI-generated interview questions and coding challenges.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg shadow-white/5"
                        >
                            <Plus className="w-5 h-5" />
                            New Practice Challenge
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            { label: 'Total Folders', value: folders.length, icon: Folder, color: 'text-blue-400' },
                            { label: 'Solved Challenges', value: challenges.filter(c => c.completed).length, icon: BookOpen, color: 'text-orange-400' },
                            { label: 'Unsolved Challenges', value: challenges.length - challenges.filter(c => c.completed).length, icon: Trophy, color: 'text-emerald-400' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between group hover:border-white/20 transition-all">
                                <div>
                                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                                </div>
                                <div className={`p-4 bg-white/5 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Find a folder..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
                            />
                        </div>
                        <button
                            onClick={() => setShowFolderModal(true)}
                            className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 font-bold hover:bg-white/10 transition-all text-gray-300 hover:text-white"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Add Folder
                        </button>
                    </div>

                    {/* Folders List */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-orange-400" />
                            <p className="text-gray-400 font-medium">Organizing your library...</p>
                        </div>
                    ) : folders.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((folder, i) => (
                                <motion.div
                                    key={folder._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => router.push(`/dashboard/coding/practice/folder/${folder._id}`)}
                                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-3xl p-6 transition-all cursor-pointer relative"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-orange-400/10 rounded-2xl flex items-center justify-center text-orange-400">
                                            <Folder className="w-7 h-7" />
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteFolder(folder._id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-xl transition-all text-gray-500 hover:text-red-400"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold mb-1 group-hover:text-orange-400 transition-colors">
                                        {folder.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium font-mono">
                                        {folder.count || 0} challenges inside
                                    </div>

                                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5">
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Open Library</span>
                                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-[40px] py-24 flex flex-col items-center text-center px-6">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                                <Dumbbell className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Build your practice sets</h3>
                            <p className="text-gray-400 max-w-sm mb-10 font-medium">
                                Organize your AI-generated interview questions into meaningful folders for structured learning.
                            </p>
                            <button
                                onClick={() => setShowFolderModal(true)}
                                className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-xl shadow-white/5"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Create Practice Folder
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
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            onClick={() => !isCreating && setShowModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-2xl bg-[#080808] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-400/10 rounded-2xl">
                                        <Sparkles className="w-8 h-8 text-orange-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold">New Challenge</h2>
                                        <p className="text-gray-500 font-medium">Artificial Intelligence for Coding Interviews</p>
                                    </div>
                                </div>
                                {!isCreating && (
                                    <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                                        <X className="w-8 h-8 text-gray-600" />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleGeneratePractice} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Practice Folder</label>
                                        <div className="flex gap-2">
                                            <select
                                                required
                                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all font-bold appearance-none cursor-pointer"
                                                value={formData.folderId}
                                                onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                                                disabled={isCreating}
                                            >
                                                <option value="" className="bg-black">Select Folder...</option>
                                                {folders.map(f => (
                                                    <option key={f._id} value={f._id} className="bg-black text-white">{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Skill or Topic</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Dynamic Programming, SQL Optimization, React Performance"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all font-bold placeholder:text-gray-700"
                                            value={formData.topic}
                                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Questions (1-10)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all font-bold"
                                            value={formData.numberOfQuestions}
                                            onChange={(e) => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) })}
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Target Role</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all font-bold appearance-none cursor-pointer"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            disabled={isCreating}
                                        >
                                            {['Frontend Developer', 'Backend Developer', 'Full Stack', 'Mobile dev', 'Data Scientist'].map(r => (
                                                <option key={r} value={r} className="bg-black text-white">{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-5 bg-orange-400/5 border border-orange-400/10 rounded-2xl">
                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest">
                                        <Sparkles className="w-4 h-4" />
                                        Estimated Cost: {(formData.numberOfQuestions * 1000).toLocaleString()} Credits
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating || !formData.folderId}
                                    className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-2xl shadow-white/5"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Generating Challenges...</span>
                                        </>
                                    ) : (
                                        <span>Generate Practice Set</span>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Folder Modal */}
            <AnimatePresence>
                {showFolderModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            onClick={() => setShowFolderModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl text-center"
                        >
                            <div className="mx-auto w-16 h-16 bg-blue-400/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6">
                                <PlusCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Create Folder</h2>
                            <p className="text-gray-500 text-sm mb-8 font-medium">Give your practice group a descriptive name</p>

                            <form onSubmit={handleCreateFolder} className="space-y-6">
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    placeholder="e.g. FAANG Preparation, React Core..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-bold text-center"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                />
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowFolderModal(false)}
                                        className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition-all"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
