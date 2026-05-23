"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef, useCallback } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    Send,
    Plus,
    History,
    MessageSquare,
    Loader2,
    Trash2,
    Sparkles,
    Zap,
    Code2,
    BrainCircuit,
    User,
    PanelRightClose,
    PanelRight
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface Conversation {
    _id: string;
    title: string;
    lastMessageAt: Date;
    messageCount: number;
}

const QUICK_PROMPTS = [
    "Explain recursion in Python",
    "How to use React useEffect?",
    "Optimize this SQL query",
    "What is a Docker container?",
];

export default function TutorPage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConvId, setCurrentConvId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/coding/tutor/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.href = '/';
        }
    }, [isLoaded, isSignedIn]);

    useEffect(() => {
        if (isSignedIn) {
            fetchConversations();
        }
    }, [isSignedIn, fetchConversations]);

    const startNewChat = () => {
        setMessages([]);
        setCurrentConvId(null);
        toast.info('New chat started');
    };

    const loadConversation = async (id: string) => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/coding/tutor/conversation/${id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
                setCurrentConvId(id);
            }
        } catch (err) {
            toast.error('Failed to load conversation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/coding/tutor/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, conversationId: currentConvId }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to get response');
            }

            const data = await res.json();
            const aiMsg: Message = { role: 'assistant', content: data.message, timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);

            if (!currentConvId) {
                setCurrentConvId(data.conversationId);
                fetchConversations();
            }
        } catch (error: any) {
            toast.error(error.message || 'Error occurred');
            setMessages(prev => prev.slice(0, -1)); // Remove user message on failure
        } finally {
            setIsLoading(false);
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
        <div className="min-h-screen bg-black text-white flex">
            <DashboardSidebar />

            <div className="flex-1 lg:pl-64 flex flex-col h-screen">
                {/* Header */}
                <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-2xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl">
                            <BrainCircuit className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="font-black text-xl tracking-tight">AI Coding Tutor</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Always Online • GPT-4o Power</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={startNewChat}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                            title="New Conversation"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-3 border rounded-xl transition-all ${showHistory ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                        >
                            {showHistory ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden">
                    {/* Chat Container */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                                    <div className="w-24 h-24 bg-purple-500/10 rounded-[2rem] flex items-center justify-center mb-8 rotate-3">
                                        <Bot className="w-12 h-12 text-purple-400" />
                                    </div>
                                    <h2 className="text-4xl font-black mb-4 tracking-tight">How can I help you code today?</h2>
                                    <p className="text-gray-500 font-medium mb-12">Ask me to fix bugs, explain concepts, or write enterprise-grade code from scratch.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                        {QUICK_PROMPTS.map((prompt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(prompt)}
                                                className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 hover:border-white/20 transition-all group"
                                            >
                                                <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{prompt}</span>
                                                <Zap className="w-4 h-4 text-purple-500 mt-2 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : ''}`}
                                        >
                                            {msg.role === 'assistant' && (
                                                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                                                    <Bot className="w-5 h-5 text-purple-400" />
                                                </div>
                                            )}

                                            <div className={`max-w-[85%] rounded-[2rem] p-6 lg:p-8 ${msg.role === 'user'
                                                    ? 'bg-purple-600 text-white rounded-tr-none'
                                                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                                }`}>
                                                <div className="prose prose-invert prose-purple max-w-none">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            </div>

                                            {msg.role === 'user' && (
                                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                                    <User className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-6">
                                            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                                                <Bot className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div className="bg-white/5 border border-white/10 rounded-[2rem] rounded-tl-none p-6 flex items-center gap-3">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input Bar */}
                        <div className="p-8 bg-black/80 backdrop-blur-xl border-t border-white/10">
                            <div className="max-w-4xl mx-auto relative group">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Tell me what you're building..."
                                    rows={1}
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-8 pr-20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all font-medium resize-none custom-scrollbar"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-3 top-3 p-3 bg-white text-black rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-4">
                                Tip: Press Shift+Enter for new lines • 100 per response
                            </p>
                        </div>
                    </div>

                    {/* History Sidebar */}
                    <AnimatePresence>
                        {showHistory && (
                            <motion.aside
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 320, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="border-l border-white/10 bg-[#080808] flex flex-col overflow-hidden"
                            >
                                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="font-bold text-sm uppercase tracking-widest text-gray-500">History</h3>
                                    <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-bold text-gray-400">{conversations.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                    {conversations.map((conv) => (
                                        <button
                                            key={conv._id}
                                            onClick={() => loadConversation(conv._id)}
                                            className={`w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden ${currentConvId === conv._id
                                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                                    : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <p className="text-xs font-bold line-clamp-1 mb-1">{conv.title}</p>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${currentConvId === conv._id ? 'text-purple-200' : 'text-gray-600'}`}>
                                                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                                                </span>
                                                <MessageSquare className={`w-3 h-3 ${currentConvId === conv._id ? 'text-purple-200' : 'text-gray-700'}`} />
                                            </div>
                                        </button>
                                    ))}
                                    {conversations.length === 0 && (
                                        <div className="h-40 flex flex-col items-center justify-center text-center px-4">
                                            <History className="w-8 h-8 text-gray-800 mb-2" />
                                            <p className="text-gray-600 text-xs font-medium">Your coding chat history will appear here.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
