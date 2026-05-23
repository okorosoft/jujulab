"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    Trash2,
    Play,
    CheckCircle2,
    Clock,
    Trophy,
    Loader2,
    FolderOpen,
    Code2,
    ChevronRight
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Challenge {
    _id: string;
    title: string;
    description: string;
    language: string;
    difficulty: string;
    points: number;
    timeLimit: string;
    completed: boolean;
}

export default function PracticeFolderPage() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const { id } = useParams();
    const [folder, setFolder] = useState<any>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.href = '/';
        }
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (isSignedIn && id) {
            fetchFolderData();
        }
    }, [isSignedIn, id]);

    const fetchFolderData = async () => {
        try {
            const res = await fetch(`/api/coding/practice/folder/${id}`);
            if (res.ok) {
                const data = await res.json();
                setFolder(data.folder);
                setChallenges(data.challenges);
            } else {
                toast.error('Folder not found');
                router.push('/dashboard/coding/practice');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteChallenge = async (chId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this challenge?')) return;

        try {
            const res = await fetch(`/api/coding/practice/challenge/${chId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setChallenges(challenges.filter(c => c._id !== chId));
                toast.success('Challenge deleted');
            }
        } catch (error) {
            toast.error('Failed to delete');
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

    return (
        <div className="min-h-screen bg-black text-white">
            <DashboardSidebar />

            <div className="lg:pl-64 pt-16 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Back & Title */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/dashboard/coding/practice"
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                                <FolderOpen className="w-3 h-3" />
                                Practice Folder
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">{folder?.name}</h1>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mb-12">
                        <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {challenges.filter(c => c.completed).length} Solved
                        </div>
                        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Code2 className="w-4 h-4" />
                            {challenges.length} Total
                        </div>
                    </div>

                    {/* Challenges Grid */}
                    {challenges.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {challenges.map((challenge, i) => (
                                <motion.div
                                    key={challenge._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => router.push(`/dashboard/coding/practice/challenge/${challenge._id}`)}
                                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-[2rem] p-8 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${challenge.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'
                                            }`}>
                                            {challenge.completed ? <CheckCircle2 className="w-7 h-7" /> : <Play className="w-6 h-6 fill-current" />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black mb-2 group-hover:text-orange-400 transition-colors">
                                                {challenge.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                                                <span className="text-orange-400">{challenge.language}</span>
                                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                <span className={
                                                    challenge.difficulty === 'Easy' ? 'text-blue-400' :
                                                        challenge.difficulty === 'Medium' ? 'text-yellow-400' :
                                                            'text-red-400'
                                                }>{challenge.difficulty}</span>
                                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {challenge.timeLimit}
                                                </span>
                                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                <span className="flex items-center gap-1.5 text-emerald-400">
                                                    <Trophy className="w-3.5 h-3.5" />
                                                    {challenge.points} XP
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => handleDeleteChallenge(challenge._id, e)}
                                            className="p-3 bg-white/5 border border-white/5 rounded-2xl text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <div className="p-3 bg-white text-black rounded-2xl group-hover:scale-110 transition-transform">
                                            <ChevronRight className="w-6 h-6" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
                                <Play className="w-8 h-8 text-gray-700" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-400">This folder is empty</h3>
                            <Link href="/dashboard/coding/practice" className="text-orange-400 font-bold hover:underline">
                                Generate some challenges!
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
