"use client";

import { motion } from "framer-motion";
import {
    Calculator,
    CheckCircle,
    FileText,
    Search,
    Globe,
    Lock,
    User,
    Clock,
    ChevronRight,
    Shield,
    File,
    Layout,
    Folder,
    Star,
    Brain,
    MessageSquare,
    ArrowUpRight,
    Sparkles,
    Terminal,
    Code,
    Activity,
    TrendingUp
} from "lucide-react";

export const MathSolverPreview = () => {
    const steps = [
        { label: "Check problem type", status: "completed" },
        { label: "Apply differentiation rules", status: "completed" },
        { label: "Simplify expression", status: "processing" },
        { label: "Final result", status: "pending" },
    ];

    return (
        <div className="w-full h-full bg-[#0D0D0D] rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] text-gray-400 font-mono">math-solver-v2.calc</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/20" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                    <div className="w-2 h-2 rounded-full bg-green-500/20" />
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="text-[10px] text-indigo-400 font-medium mb-1 uppercase tracking-wider">Problem</div>
                    <div className="text-sm text-white font-mono font-medium">d/dx [sin(x²) + e^2x]</div>
                </div>
                <div className="space-y-2">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.2 }}
                            className="flex items-center gap-3"
                        >
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${step.status === 'completed' ? 'bg-indigo-500/20 text-indigo-400' :
                                step.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-white/5 text-gray-600'
                                }`}>
                                {step.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <div className="w-1 h-1 rounded-full bg-current" />}
                            </div>
                            <span className={`text-[11px] ${step.status === 'pending' ? 'text-gray-600' : 'text-gray-300'}`}>
                                {step.label}
                            </span>
                        </motion.div>
                    ))}
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-auto bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20"
                >
                    <div className="text-[10px] text-indigo-400 font-medium mb-1 uppercase tracking-wider">Solution</div>
                    <div className="text-xs text-white font-mono break-all font-medium">2x cos(x²) + 2e^2x</div>
                </motion.div>
            </div>
        </div>
    );
};

export const OriginalityReportPreview = () => {
    return (
        <div className="w-full h-full bg-[#0D0D0D] rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] text-gray-400 font-mono">originality-report.pdf</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                    <span className="text-[9px] text-purple-300 font-bold uppercase tracking-wider">Scanned</span>
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Content Score</div>
                        <div className="text-2xl font-bold text-white">98.4%</div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">HI</span>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400">Human Likelihood</span>
                            <span className="text-green-400">High</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "98%" }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400">AI Signature</span>
                            <span className="text-gray-500">Negligible</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "2%" }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-indigo-500/50"
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Top Sources</div>
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] text-gray-300">nature.com/articles/...</span>
                        </div>
                        <span className="text-[9px] text-gray-500">2.1% Match</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StudyLibraryPreview = () => {
    const documents = [
        { name: "Advanced Thermodynamics", type: "pdf", size: "4.2 MB", date: "2h ago" },
        { name: "Global Economics 2024", type: "docx", size: "1.1 MB", date: "5h ago" },
        { name: "Neural Networks Intro", type: "pdf", size: "8.5 MB", date: "Yesterday" },
    ];

    return (
        <div className="w-full h-full bg-[#0D0D0D] rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded flex items-center justify-center">
                        <Folder className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs text-white font-medium italic">Study Space</span>
                </div>
                <div className="w-32 h-7 bg-white/5 border border-white/10 rounded flex items-center px-2 gap-2">
                    <Search className="w-3 h-3 text-gray-500" />
                    <div className="w-16 h-2 bg-gray-700 rounded-full" />
                </div>
            </div>
            <div className="p-3 flex-1 overflow-hidden">
                <div className="grid grid-cols-1 gap-2">
                    {documents.map((doc, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.15 }}
                            className="group p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded flex items-center justify-center ${doc.type === 'pdf' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-[11px] text-white font-medium group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{doc.name}</div>
                                    <div className="text-[9px] text-gray-500">{doc.size} • {doc.date}</div>
                                </div>
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-white transition-colors" />
                        </motion.div>
                    ))}
                </div>
                <div className="mt-4 p-3 border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-emerald-500/20 transition-all">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-300 italic uppercase">Upload new resources</span>
                </div>
            </div>
        </div>
    );
};

export const AICardPreview = () => {
    return (
        <div className="w-full h-full bg-[#0D0D0D] rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl relative group/card">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 font-mono italic">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 blink" />
                    <span className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">ByLearn.ai</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tight">Active session</span>
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-4 relative z-10 font-mono">
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex-shrink-0 flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="bg-white/5 rounded-xl rounded-tl-none p-3 border border-white/10 flex-1">
                            <p className="text-[10px] text-gray-300 leading-relaxed uppercase italic">Explain quantum tunneling in simple terms for my exam.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex-shrink-0 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="bg-indigo-500/10 rounded-xl rounded-tl-none p-3 border border-indigo-500/20 flex-1">
                            <p className="text-[10px] text-gray-300 leading-relaxed italic uppercase">
                                Imagine a ball trying to roll over a hill. In classical physics, it needs enough energy. In quantum physics, it can pop...
                            </p>
                            <div className="mt-2 flex gap-1.5 font-bold uppercase">
                                <span className="text-[8px] text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">Physics</span>
                                <span className="text-[8px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Quantum</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-auto flex items-center justify-between text-[9px] text-gray-500 uppercase tracking-widest italic pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 font-bold italic">
                        <Clock className="w-3 h-3" />
                        Processed in 0.8s
                    </div>
                    <div className="flex items-center gap-3 font-mono italic font-bold">
                        <span className="hover:text-white cursor-pointer transition-colors">Regenerate</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Share</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CodeAssistantPreview = () => {
    return (
        <div className="w-full h-full bg-[#0D0D0D] rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl relative">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] text-gray-400 font-mono italic">analyzer.py</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="w-6 h-6 rounded bg-blue-500/20 flex-shrink-0 flex items-center justify-center">
                            <Code className="w-3 h-3 text-blue-400" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">Translate to TypeScript</div>
                            <div className="text-[10px] text-blue-300 font-mono bg-white/5 p-2 rounded border border-white/5">
                                def greet(name):<br />
                                &nbsp;&nbsp;return f&quot;Hello &#123;name&#125;&quot;
                            </div>
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex gap-3"
                    >
                        <div className="w-6 h-6 rounded bg-purple-500/20 flex-shrink-0 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-tighter italic">AI Conversion complete</div>
                            <div className="text-[10px] text-purple-300 font-mono bg-purple-500/5 p-2 rounded border border-purple-500/10">
                                const greet = (name: string): string =&gt; &#123;<br />
                                &nbsp;&nbsp;return `Hello $&#123;name&#125;`;<br />
                                &#125;;
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="mt-auto p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] text-gray-400 uppercase font-bold italic">Tutor: &quot;Logic optimized&quot;</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SubjectMasteryPreview = () => {
    const subjects = [
        { name: "Quantum Physics", progress: 85, color: "bg-indigo-500" },
        { name: "Modern History", progress: 62, color: "bg-purple-500" },
        { name: "Advanced Algebra", progress: 91, color: "bg-blue-500" },
    ];

    return (
        <div className="flex flex-col gap-6 p-6 bg-white/5 rounded-2xl border border-white/10 group-hover:border-indigo-500/30 transition-all duration-300 shadow-2xl">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Growth Analytics</span>
                    </div>
                    <span className="text-xl font-bold text-white italic">Mastery: Level 8</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
            </div>

            <div className="space-y-4">
                {subjects.map((sub, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-gray-300 font-medium">{sub.name}</span>
                            <span className="text-indigo-400 font-mono font-bold">{sub.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${sub.progress}%` }}
                                transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                                className={`h-full ${sub.color} shadow-[0_0_10px_rgba(99,102,241,0.5)]`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500 italic uppercase font-bold">
                <span>Top 5% of all students</span>
                <span className="text-indigo-400">+12% this week</span>
            </div>
        </div>
    );
};

export const SecurityCompliancePreview = () => {
    return (
        <div className="flex flex-col gap-6 p-6 bg-white/5 rounded-2xl border border-white/10 group-hover:border-green-500/30 transition-all duration-300 shadow-2xl">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Integrity</span>
                    </div>
                    <span className="text-xl font-bold text-white italic tracking-tighter uppercase">Ultra Secure</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-green-400 font-mono text-[10px] font-bold italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        ONLINE
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: "SSL Traffic", value: "256-bit", color: "text-green-400" },
                    { label: "AI Models", value: "Enterprise", color: "text-blue-400" },
                    { label: "Data Latency", value: "18ms", color: "text-orange-400" },
                    { label: "API Uptime", value: "99.99%", color: "text-purple-400" }
                ].map((item, i) => (
                    <div key={i} className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-white/10 transition-colors">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{item.label}</span>
                        <span className={`text-xs font-mono font-bold ${item.color}`}>{item.value}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold uppercase italic">
                    <span>Threat scan progress</span>
                    <span>100%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-green-500/50" />
                </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] text-green-400/80 font-bold italic uppercase tracking-wider">
                <CheckCircle className="w-3.5 h-3.5" />
                Certified academic integrity
            </div>
        </div>
    );
};

export const RecentResearchPreview = () => {
    return (
        <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2">
            <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest text-left">Trending Research</span>
            <div className="space-y-2">
                {[
                    "Neural Networks in 2024",
                    "Climate Change & Ocean Currents",
                    "The Renaissance of AI Art"
                ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-1 rounded transition-colors text-left uppercase">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
                            <span className="text-[9px] text-gray-400 truncate max-w-[120px] font-bold italic">{item}</span>
                        </div>
                        <ArrowUpRight className="w-2.5 h-2.5 text-gray-600 group-hover:text-indigo-400" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const TranslationStatPreview = () => {
    return (
        <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest text-left">Network Status</span>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[8px] text-green-500 uppercase font-mono">Global</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
                <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-white italic">12+</span>
                    <span className="text-[8px] text-gray-500 uppercase font-bold">Languages</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-white italic">0.4s</span>
                    <span className="text-[8px] text-gray-500 uppercase font-bold">Avg Speed</span>
                </div>
            </div>
        </div>
    );
};
