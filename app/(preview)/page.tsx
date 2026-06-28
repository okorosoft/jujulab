"use client";

import { useEffect, useState } from "react";
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Zap,
  Target,
  Shield,
  CheckCircle,
  Star,
  Users,
  TrendingUp,
  Clock,
  FileText,
  BarChart3,
  Crown,
  Sparkles,
  ChevronDown,
  Gift,
  Building,
  Globe,
  Lock,
  Rocket,
  Award,
  ArrowUpRight,
  Languages,
  PieChart,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Calculator,
  BookOpen,
  ScrollText,
  SpellCheck,
  CopyCheck,
  Code,
  Hash,
  Type,
  Wrench,
  Terminal,
  UserCog,
  GraduationCap
} from "lucide-react";
import NextLink from "next/link";
import Image from "next/image";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { Boxes } from "@/components/ui/background-boxes";
import { LightningFastDemo } from "@/components/ui/lightning-fast-demo";
import { InfiniteTestimonials } from "@/components/ui/infinite-testimonials";
import {
  MathSolverPreview,
  OriginalityReportPreview,
  StudyLibraryPreview,
  AICardPreview,
  CodeAssistantPreview,
  SubjectMasteryPreview,
  SecurityCompliancePreview,
  RecentResearchPreview,
  TranslationStatPreview
} from "@/components/ui/dashboard-previews";

// Footer Logo component with fallback
function FooterLogo() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="text-2xl font-bold text-white mb-4">
        <span className="text-white">Juju</span>Lab
      </div>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="Jujulab Logo"
      width={150}
      height={40}
      className="h-10 w-auto mb-4"
      onError={() => setImageError(true)}
    />
  );
}

export default function LandingPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Analytics tracking function
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        event_category: 'Landing Page',
        ...properties,
      });
    }
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Jujulab",
    description: "Jujulab is your AI learning companion for homework help, AI tutoring, math solving, chemistry, physics, coding, writing, AI humanizer, PDF summaries, video summaries, and personalized learning.",
    "url": "https://Jujulab.ai",
    "applicationCategory": "WebApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier available with paid plans starting at $15/month"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1500000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "author": {
      "@type": "Organization",
      "name": "ByLearn"
    },
    "publisher": {
      "@type": "Organization",
      "name": "jujuLab",
      "url": "https://jujulab.ai"
    },
    "featureList": [
      "AI Content Humanization",
      "AI Detection (Text, Image, Video)",
      "Ask AI Chat (GPT-4o, DeepSeek, Gemini)",
      "Document Summarization",
      "AI Homework Helper",
      "AI Math Solver",
      "Grammar & Spell Check",
      "Plagiarism Detection",
      "Multi-Language Translation",
      "HTML Conversion Tools",
      "Word & Character Counter",
      "AI Code Translation",
      "AI Coding Lessons",
      "AI Practice Challenges",
      "AI Coding Tutor",
      "Real-time Processing",
      "File Upload Support"
    ]
  };

  // Navigation items
  const navItems = [
    {
      name: "Features",
      link: "#features",
    },
    {
      name: "AI Tools",
      link: "#ai-tools",
    },
    {
      name: "Pricing",
      link: "#pricing",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What is Jujulab?",
    answer:
      "Jujulab is your AI learning companion. It helps students with homework, math, chemistry, physics, biology, writing, coding, summaries, and guided study support.",
  },
  {
    question: "How does the credit system work?",
    answer:
      "Each plan gives you monthly credits. Credits are used when you run AI tools, and they reset every month based on your plan.",
  },
  {
    question: "Can Jujulab help with math, chemistry, and physics?",
    answer:
      "Yes. Jujulab is built to guide learners through math, chemistry, physics, biology, and many other subjects with step-by-step explanations.",
  },
  {
    question: "Does Jujulab support files and video summaries?",
    answer:
      "Yes. Jujulab supports learning workflows for notes, PDFs, documents, images, and video summaries so students can study faster from their own materials.",
  },
  {
    question: "Do you offer AI Humanizer?",
    answer:
      "Yes. Jujulab includes an AI Humanizer to help rewrite AI-generated text into more natural, polished, human-sounding writing.",
  },
  {
    question: "Who is Jujulab for?",
    answer:
      "Jujulab is for college students, high school students, parents helping their children, self-learners, writers, and anyone who wants a personal AI study companion.",
  },
  {
    question: "Do unused credits roll over?",
    answer:
      "No. Credits reset monthly based on your active plan."
    }
  ];

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Navbar */}
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <NextLink href="/dashboard">
                <NavbarButton variant="secondary">Dashboard</NavbarButton>
              </NextLink>
            ) : (
              <SignInButton mode="modal">
                <NavbarButton variant="secondary">Login</NavbarButton>
              </SignInButton>
            )}
            {isSignedIn ? (
              <NextLink href="/dashboard/ai-humanize">
                <NavbarButton variant="primary">Get Started</NavbarButton>
              </NextLink>
            ) : (
              <SignInButton mode="modal">
                <NavbarButton variant="primary">Get Started</NavbarButton>
              </SignInButton>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-white hover:text-gray-300 transition-colors"
              >
                <span className="block py-2">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 pt-4">
              {isSignedIn ? (
                <>
                  <NextLink href="/dashboard">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="secondary"
                      className="w-full"
                    >
                      Dashboard
                    </NavbarButton>
                  </NextLink>
                  <NextLink href="/dashboard/ai-humanize">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="primary"
                      className="w-full"
                    >
                      Get Started
                    </NavbarButton>
                  </NextLink>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="secondary"
                      className="w-full"
                    >
                      Login
                    </NavbarButton>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="primary"
                      className="w-full"
                    >
                      Get Started
                    </NavbarButton>
                  </SignInButton>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden pt-32 pb-32">
        {/* Background Boxes */}
        <div className="absolute inset-0 w-full h-full z-0">
          <Boxes />
        </div>

        {/* Mask overlay - transparent with radial gradient mask */}
        <div className="absolute inset-0 w-full h-full z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30 w-full">
          <div className="flex flex-col items-center justify-center text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">AI-powered learning • Homework help • Smart tutoring</span>
            </motion.div>

            {/* Main Heading - Full Width */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight">
                Your Personal 
                <br />
                <span className="relative inline-block">
                  AI Learning Companion
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute -bottom-2 left-0 w-full h-4"
                    viewBox="0 0 200 12"
                    fill="none"
                  >
                    <path
                      d="M2 8C50 2 100 10 150 6C170 4 190 8 198 6"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </motion.svg>
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl sm:text-2xl lg:text-3xl text-gray-400 max-w-4xl mx-auto leading-relaxed"
            >
              Study smarter with AI tutoring, homework help, math guidance, coding support, video summaries, AI humanizer, and personalized learning tools.
            </motion.p>

            {/* Key Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 w-full max-w-3xl"
            >
              {[
                { icon: Shield, text: "Strict Privacy" },
                { icon: Rocket, text: "Accelerated Learning" },
                { icon: GraduationCap, text: "Expert AI Tutors" }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + idx * 0.1 }}
                  className="flex items-center gap-2 justify-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-300">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              {isSignedIn ? (
                <NextLink href="/dashboard">
                  <button
                    onClick={() => trackEvent('cta_click', { button: 'start_humanizing_hero' })}
                    className="group inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </NextLink>
              ) : (
                <SignInButton mode="modal">
                  <button
                    onClick={() => trackEvent('cta_click', { button: 'start_humanizing_hero' })}
                    className="group inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Start Learning Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              )}
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm"
              >
                Explore Tools
              </a>
            </motion.div>\
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 bg-black border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">JujuLab Next-Gen Learning Ecosystem</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything Students Need in One<span className="text-indigo-400">AI Companion</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From solving difficult equations to understanding chemistry concepts and improving your writing, Jujulab helps guide your learning journey.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
            {/* AI Homework & Math - Large Card (2x2) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="md:col-span-2 md:row-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full border border-indigo-500/30 w-fit mb-6">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-300">Smart Learning</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Your Personal AI Study Companion
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Stuck on a complex math problem or need help with a difficult assignment? Our AI Learning suite provides step-by-step explanations and deep insights across all academic subjects.
                </p>
                <div className="mb-6 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 h-[240px]">
                  <MathSolverPreview />
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    "Step-by-step Math & Science solutions",
                    "Comprehensive Homework Assistance",
                    "24/7 access to AI expert tutors",
                    "Personalized learning pace"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="my-8">
                  <SubjectMasteryPreview />
                </div>

                {isSignedIn ? (
                  <NextLink href="/dashboard/ai-homework-helper">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all duration-300 w-fit">
                      Start Learning Now
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </NextLink>
                ) : (
                  <SignInButton mode="modal">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all duration-300 w-fit">
                      Start Learning Now
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </SignInButton>
                )}

                {/* Additional Content to fill space */}
                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Integrated academic suite</span>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { icon: Calculator, label: "Math Solver" },
                        { icon: GraduationCap, label: "Expert Tutor" },
                        { icon: Languages, label: "Translator" },
                        { icon: ScrollText, label: "Summarizer" }
                      ].map((tool, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                          <tool.icon className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-xs text-gray-400">{tool.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-500 italic">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-5 h-5 rounded-full border border-black bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                      ))}
                    </div>
                    <span>Join 12k+ students learning today</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Lightning Fast - Medium Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden flex flex-col"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col flex-1">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Instant Feedback</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Get real-time answers and feedback on your work. Our optimized infrastructure ensures you never lose your learning flow.
                </p>
                {/* Live Demo - Expanded */}
                <div className="mt-auto bg-black/30 rounded-lg p-4 border border-white/10 min-h-[180px] flex-1 flex items-center">
                  <LightningFastDemo />
                </div>
              </div>
            </motion.div>

            {/* File Upload - Medium Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden flex flex-col"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col flex-1">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Smart Study Library</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Upload PDF textbooks, lecture notes, or research papers. Our AI analyzes your documents to help you learn faster.
                </p>
                {/* Dashboard Preview */}
                <div className="mt-auto rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-1 h-[200px] group-hover:scale-[1.02] transition-transform duration-500">
                  <StudyLibraryPreview />
                </div>
              </div>
            </motion.div>

            {/* AI Detector - Large Card (2x2) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="md:col-span-2 md:row-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-500/30 w-fit mb-6">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">AI Detection</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Master Original Writing
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Use our advanced detection suite to verify the originality of your work. Learn to write with authenticity while leveraging AI insights.
                </p>
                <div className="mb-6 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 h-[240px]">
                  <OriginalityReportPreview />
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    "Multi-detector analysis (GPTZero, Turnitin, etc.)",
                    "Real-time AI probability scoring",
                    "Detailed detection reports",
                    "Support for all major AI models"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="my-8">
                  <SecurityCompliancePreview />
                </div>

                {isSignedIn ? (
                  <NextLink href="/dashboard/ai-detector">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all duration-300 w-fit">
                      Try AI Detector
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </NextLink>
                ) : (
                  <SignInButton mode="modal">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all duration-300 w-fit">
                      Try AI Detector
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </SignInButton>
                )}

                {/* Additional Content to fill space */}
                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Comprehensive integrity toolkit</span>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { icon: Shield, label: "AI Detector" },
                        { icon: ImageIcon, label: "Image Analysis" },
                        { icon: Video, label: "Video Integrity" },
                        { icon: CopyCheck, label: "Plagiarism" }
                      ].map((tool, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 group-hover:border-green-500/30 transition-colors">
                          <tool.icon className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-xs text-gray-400">{tool.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-mono uppercase tracking-tighter">Live security monitoring active</span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <span className="font-mono uppercase tracking-tighter">99.8% Accuracy rate</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Translation - Medium Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                {/* Orbit Animation Container */}
                <div className="w-56 h-56 mb-4 relative flex items-center justify-center mx-auto">
                  {/* Orbital track circle */}
                  <div className="absolute inset-0 rounded-full border border-blue-500/20"></div>

                  {/* Center icon */}
                  <div className="absolute z-10 w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Languages className="w-5 h-5 text-blue-400" />
                  </div>

                  {/* Orbiting language flags container - only render after mount to avoid hydration mismatch */}
                  {isMounted && (
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      {(() => {
                        const languages = [
                          { code: 'en', name: 'EN', flag: '🇺🇸', angle: 0 },
                          { code: 'es', name: 'ES', flag: '🇪🇸', angle: 30 },
                          { code: 'fr', name: 'FR', flag: '🇫🇷', angle: 60 },
                          { code: 'de', name: 'DE', flag: '🇩🇪', angle: 90 },
                          { code: 'it', name: 'IT', flag: '🇮🇹', angle: 120 },
                          { code: 'pt', name: 'PT', flag: '🇵🇹', angle: 150 },
                          { code: 'ru', name: 'RU', flag: '🇷🇺', angle: 180 },
                          { code: 'ja', name: 'JA', flag: '🇯🇵', angle: 210 },
                          { code: 'ko', name: 'KO', flag: '🇰🇷', angle: 240 },
                          { code: 'zh', name: 'ZH', flag: '🇨🇳', angle: 270 },
                          { code: 'ar', name: 'AR', flag: '🇸🇦', angle: 300 },
                          { code: 'hi', name: 'HI', flag: '🇮🇳', angle: 330 },
                        ];
                        const radius = 80; // Increased from 56
                        const containerSize = 224; // w-56 h-56 = 224px
                        const centerX = containerSize / 2;
                        const centerY = containerSize / 2;

                        // Calculate positions for lines (in pixels)
                        const positions = languages.map(lang => {
                          const angleRad = (lang.angle * Math.PI) / 180;
                          return {
                            x: centerX + Math.cos(angleRad) * radius,
                            y: centerY + Math.sin(angleRad) * radius,
                            ...lang
                          };
                        });

                        return (
                          <>
                            {/* Interconnect lines - connecting all flags */}
                            <svg
                              className="absolute inset-0 w-full h-full"
                              style={{ overflow: 'visible', pointerEvents: 'none' }}
                              viewBox={`0 0 ${containerSize} ${containerSize}`}
                              preserveAspectRatio="none"
                            >
                              {positions.map((pos, idx) => {
                                const nextIdx = (idx + 1) % positions.length;
                                const nextPos = positions[nextIdx];
                                return (
                                  <line
                                    key={`line-${idx}`}
                                    x1={pos.x}
                                    y1={pos.y}
                                    x2={nextPos.x}
                                    y2={nextPos.y}
                                    stroke="rgba(59, 130, 246, 0.4)"
                                    strokeWidth="1.5"
                                    className="stroke-blue-500/40"
                                  />
                                );
                              })}
                            </svg>

                            {/* Language flags */}
                            {languages.map((lang, idx) => {
                              const angleRad = (lang.angle * Math.PI) / 180;
                              const x = Math.cos(angleRad) * radius;
                              const y = Math.sin(angleRad) * radius;

                              return (
                                <div
                                  key={idx}
                                  className="absolute w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden z-10"
                                  style={{
                                    left: `calc(50% + ${x}px)`,
                                    top: `calc(50% + ${y}px)`,
                                    transform: 'translate(-50%, -50%)',
                                  }}
                                  title={lang.name}
                                >
                                  <span className="text-lg">{lang.flag}</span>
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Multi-Language Translation</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Translate your content to 12+ languages including Spanish, French, German, Japanese, and more with AI-powered accuracy.
                </p>
                <TranslationStatPreview />
              </div>
            </motion.div>

            {/* Multiple AI Models - Medium Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                {/* Orbit Animation Container */}
                <div className="w-56 h-56 mb-4 relative flex items-center justify-center mx-auto">
                  {/* Orbital track circle */}
                  <div className="absolute inset-0 rounded-full border border-indigo-500/20"></div>

                  {/* Center icon */}
                  <div className="absolute z-10 w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                  </div>

                  {/* Orbiting logos container - only render after mount to avoid hydration mismatch */}
                  {isMounted && (
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      {(() => {
                        const logos = [
                          { src: "/dashboard/ai-detector/claude-logo.png", angle: 0 },
                          { src: "/dashboard/ai-detector/deepseek-logo.png", angle: 72 },
                          { src: "/dashboard/ai-detector/gemini-logo.png", angle: 144 },
                          { src: "/dashboard/ai-detector/gpt-models-logo.png", angle: 216 },
                          { src: "/dashboard/ai-detector/grok-logo.png", angle: 288 },
                        ];
                        const radius = 80;
                        const containerSize = 224; // w-56 h-56 = 224px
                        const centerX = containerSize / 2;
                        const centerY = containerSize / 2;

                        // Calculate positions for lines (in pixels)
                        const positions = logos.map(logo => {
                          const angleRad = (logo.angle * Math.PI) / 180;
                          return {
                            x: centerX + Math.cos(angleRad) * radius,
                            y: centerY + Math.sin(angleRad) * radius,
                            ...logo
                          };
                        });

                        return (
                          <>
                            {/* Interconnect lines */}
                            <svg
                              className="absolute inset-0 w-full h-full"
                              style={{ overflow: 'visible', pointerEvents: 'none' }}
                              viewBox={`0 0 ${containerSize} ${containerSize}`}
                              preserveAspectRatio="none"
                            >
                              {positions.map((pos, idx) => {
                                const nextIdx = (idx + 1) % positions.length;
                                const nextPos = positions[nextIdx];
                                return (
                                  <line
                                    key={`line-${idx}`}
                                    x1={pos.x}
                                    y1={pos.y}
                                    x2={nextPos.x}
                                    y2={nextPos.y}
                                    stroke="rgba(99, 102, 241, 0.3)"
                                    strokeWidth="1"
                                    className="stroke-indigo-500/30"
                                  />
                                );
                              })}
                            </svg>

                            {/* Logos */}
                            {logos.map((logo, idx) => {
                              const angleRad = (logo.angle * Math.PI) / 180;
                              const x = Math.cos(angleRad) * radius;
                              const y = Math.sin(angleRad) * radius;

                              return (
                                <div
                                  key={idx}
                                  className="absolute w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden z-10"
                                  style={{
                                    left: `calc(50% + ${x}px)`,
                                    top: `calc(50% + ${y}px)`,
                                    transform: 'translate(-50%, -50%)',
                                  }}
                                >
                                  <Image
                                    src={logo.src}
                                    alt={`AI Model ${idx + 1}`}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 object-contain"
                                  />
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Universal Research</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Connect with GPT, Claude, and Gemini for diverse perspectives. Cross-reference academic sources with ease.
                </p>
                <RecentResearchPreview />
              </div>
            </motion.div>

            {/* Coding Powerhouse - New Large Card (4x1) or similar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="md:col-span-2 lg:col-span-4 bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-white/10 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-500/30 w-fit mb-6">
                    <Code className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">New: Coding Powerhouse</span>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">
                    Master Any Language with <span className="text-blue-400">AI Code Assistant</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Languages className="w-4 h-4 text-blue-400" />
                        </div>
                        <h4 className="text-white font-semibold">Code Translator</h4>
                      </div>
                      <p className="text-gray-400 text-sm">Translate logic across 10+ programming languages flawlessly.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-purple-400" />
                        </div>
                        <h4 className="text-white font-semibold">AI Lessons & Practice</h4>
                      </div>
                      <p className="text-gray-400 text-sm">Learn with personalized courses and interactive challenges.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-green-400" />
                        </div>
                        <h4 className="text-white font-semibold">24/7 AI Tutor</h4>
                      </div>
                      <p className="text-gray-400 text-sm">Get real-time debugging help and architecture advice anytime.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <Target className="w-4 h-4 text-yellow-400" />
                        </div>
                        <h4 className="text-white font-semibold">Zero Hallucinations</h4>
                      </div>
                      <p className="text-gray-400 text-sm">Strict validation ensures your code is production-ready.</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full max-w-md bg-white/5 rounded-2xl border border-white/10 p-4 backdrop-blur-xl group-hover:border-blue-500/50 transition-colors h-[320px]">
                  <CodeAssistantPreview />
                </div>
              </div>
            </motion.div>
          </div >
        </div >
      </section >

      {/* All AI Tools Section */}
      < section id="ai-tools" className="py-24 bg-black border-y border-white/10" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <Wrench className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Complete AI Toolkit</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Advanced Learning Toolkit
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Master any subject with our specialized AI tools designed for students, researchers, and lifelong learners.
            </p>
          </motion.div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Academic Writing Assistant */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Academic Writing Assistant</h3>
              <p className="text-gray-400 text-sm mb-4">Perfect your tone and style while ensuring your work remains natural and professional.</p>
              <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>FREE</span>
              </div>
            </motion.div>

            {/* Originality Checker */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Originality Checker</h3>
              <p className="text-gray-400 text-sm mb-4">Verify the authenticity of your research and ensure your content meets academic standards.</p>
              <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>FREE</span>
              </div>
            </motion.div>

            {/* Ask AI */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ask AI</h3>
              <p className="text-gray-400 text-sm mb-4">Chat with GPT-4o, DeepSeek, and Gemini AI models with file upload support</p>
              <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>FREE</span>
              </div>
            </motion.div>

            {/* Word Counter */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-4">
                <Hash className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Word Counter</h3>
              <p className="text-gray-400 text-sm mb-4">Count words and characters in your text</p>
              <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>FREE</span>
              </div>
            </motion.div>

            {/* Character Counter */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-4">
                <Type className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Character Counter</h3>
              <p className="text-gray-400 text-sm mb-4">Count characters, words, and paragraphs</p>
              <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>FREE</span>
              </div>
            </motion.div>

            {/* Smart Study Condenser */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
                <ScrollText className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Study Condenser</h3>
              <p className="text-gray-400 text-sm mb-4">Summarize textbooks, PDFs, lecture videos, and images for faster revision.</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* AI Image Detection */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Image Detection</h3>
              <p className="text-gray-400 text-sm mb-4">Detect if images are AI-generated with advanced analysis</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* AI Video Detection */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Video Detection</h3>
              <p className="text-gray-400 text-sm mb-4">Detect if videos are AI-generated using advanced algorithms</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* AI Translator */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4">
                <Languages className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Translator</h3>
              <p className="text-gray-400 text-sm mb-4">Translate text between multiple languages with AI accuracy</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* 24/7 Study Companion */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">24/7 Study Companion</h3>
              <p className="text-gray-400 text-sm mb-4">Get instant help across multiple subjects with comprehensive, concept-focused solutions.</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* Step-by-Step Math Tutor */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Step-by-Step Math Tutor</h3>
              <p className="text-gray-400 text-sm mb-4">Solve complex equations and learn the underlying logic with detailed AI derivations.</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* Grammar Check */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                <SpellCheck className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Grammar Check</h3>
              <p className="text-gray-400 text-sm mb-4">Check and correct grammar errors with AI-powered suggestions</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* Spell Check */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.65 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Spell Check</h3>
              <p className="text-gray-400 text-sm mb-4">Find and fix spelling mistakes instantly</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* Plagiarism Check */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4">
                <CopyCheck className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Plagiarism Check</h3>
              <p className="text-gray-400 text-sm mb-4">Detect plagiarism using ZeroGPT technology</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* HTML to Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.75 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">HTML to Text</h3>
              <p className="text-gray-400 text-sm mb-4">Convert HTML code to plain text</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* Text to HTML */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Text to HTML</h3>
              <p className="text-gray-400 text-sm mb-4">Convert plain text to HTML format</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* PDF to HTML */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.85 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">PDF to HTML</h3>
              <p className="text-gray-400 text-sm mb-4">Convert PDF documents to HTML</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* AI Code Translator */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4">
                <Languages className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Code Translator</h3>
              <p className="text-gray-400 text-sm mb-4">Translate your code between 10+ programming languages flawlessly</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* AI Coding Lessons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.95 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Coding Lessons</h3>
              <p className="text-gray-400 text-sm mb-4">Master new programming concepts with AI-generated personalized courses</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* AI Practice Challenges */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.0 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                <Terminal className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Practice Challenges</h3>
              <p className="text-gray-400 text-sm mb-4">Solve AI-generated coding challenges with real-time validation</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>

            {/* AI Coding Tutor */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.05 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mb-4">
                <UserCog className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Coding Tutor</h3>
              <p className="text-gray-400 text-sm mb-4">Get 24/7 expert help for debugging, optimization, and architecture</p>
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
                <Star className="w-4 h-4" />
                <span>$1</span>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2 }}
            className="text-center mt-12"
          >
            {isSignedIn ? (
              <NextLink href="/dashboard/market">
                <button className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Explore All Tools
                  <ArrowRight className="w-5 h-5" />
                </button>
              </NextLink>
            ) : (
              <SignInButton mode="modal">
                <button className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Explore All Tools
                  <ArrowRight className="w-5 h-5" />
                </button>
              </SignInButton>
            )}
          </motion.div>
        </div>
      </section >

      {/* Pricing Preview Section */}
      < section id="pricing" className="py-24 bg-black border-y border-white/10" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <Crown className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Pricing Plans</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Flexible Credit-Based Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Pay only for what you use. Purchase tools individually or get credits for all tools with our Super Saving Plan.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Individual Tools */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">Individual Tools</h3>
              <p className="text-gray-400 mb-6 text-center">Pay per tool</p>
              <div className="text-4xl font-bold text-white mb-8 text-center">
                $1<span className="text-lg text-gray-400">/tool</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "One-time purchase per tool",
                  "Access forever after purchase",
                  "Credits required to use",
                  "Choose only what you need"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              {isSignedIn ? (
                <NextLink href="/dashboard/market">
                  <button className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm">
                    Browse Tools
                  </button>
                </NextLink>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm">
                    Browse Tools
                  </button>
                </SignInButton>
              )}
            </motion.div>

            {/* Super Saving Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border-2 border-yellow-500/50 hover:border-yellow-500/70 transition-all duration-300 relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border border-yellow-400/50">
                  ⭐ Best Value
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">Super Saving Plan</h3>
              <p className="text-gray-400 mb-6 text-center">Credits for all tools</p>
              <div className="text-4xl font-bold text-white mb-8 text-center">
                $15<span className="text-lg text-gray-400">/purchase</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
  "700 monthly credits",
  "Homework and study assistance",
  "Step-by-step math guidance",
  "Writing and AI Humanizer tools",
  "Smart summaries and learning support"
].map((item, idx) => (
  <li key={idx} className="flex items-start gap-3">
    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
    <span className="text-gray-300 text-sm">{item}</span>
  </li>
))}
              </ul>
              {isSignedIn ? (
                <NextLink href="/dashboard/credits">
                  <button className="w-full px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                    Buy Credits
                  </button>
                </NextLink>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                    Buy Credits
                  </button>
                </SignInButton>
              )}
            </motion.div>

            {/* Credit Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">
Extra Credits
</h3>

<p className="text-gray-400 mb-6 text-center">
For additional usage
</p>

<div className="text-4xl font-bold text-white mb-8 text-center">
$5<span className="text-lg text-gray-400">+</span>
</div>

<ul className="space-y-3 mb-8">
{[
"Add extra credits anytime",
"For heavy learning sessions",
"Use with Pro and Elite plans",
"Instant activation",
"No interruption to subscription"
].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              {isSignedIn ? (
                <NextLink href="/dashboard/credits">
                  <button className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm">
                    Buy Credits
                  </button>
                </NextLink>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm">
                    Buy Credits
                  </button>
                </SignInButton>
              )}
            </motion.div>
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-24 bg-black" >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Learn Smarter?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join students using Jujulab as their personal AI companion for homework, tutoring, coding, writing, and smarter studying.b
            </p>
            {isSignedIn ? (
              <NextLink href="/dashboard">
                <button className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Explore All Tools
                  <ArrowRight className="w-5 h-5" />
                </button>
              </NextLink>
            ) : (
              <SignInButton mode="modal">
                <button className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Explore All Tools
                  <ArrowRight className="w-5 h-5" />
                </button>
              </SignInButton>
            )}
          </motion.div>
        </div>
      </section >

      {/* Testimonials Section */}
      < section className="py-24 bg-black border-y border-white/10" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <Star className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Students Love Learning With Jujulab
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Discover how students use Jujulab to learn faster, solve problems, and study with confidence.
            </p>
          </motion.div>

          <InfiniteTestimonials />
        </div>
      </section >

      {/* FAQ Section */}
      < section className="py-24 bg-black border-t border-white/10" >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about our platform
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/10 transition-colors"
                >
                  <span className="text-lg font-semibold text-white">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${openIndex === index ? 'rotate-180' : ''
                      }`}
                  />
                </button>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="bg-black border-t border-white/10 py-12" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-3xl font-black tracking-tight">
  <span className="text-white">Juju</span>
  <span className="text-blue-400">Lab</span>
</div>
              <p className="text-gray-400 text-sm">
                Your AI companion for studying, homework help, tutoring, coding, summaries, and personalized learning.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">Features</a></li>
                <li><a href="#ai-tools" className="text-gray-400 hover:text-white text-sm transition-colors">AI Tools</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</a></li>
                {isSignedIn && (
                  <>
                    <li><NextLink href="/dashboard/market" className="text-gray-400 hover:text-white text-sm transition-colors">Market</NextLink></li>
                    <li><NextLink href="/dashboard/credits" className="text-gray-400 hover:text-white text-sm transition-colors">Credits</NextLink></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><NextLink href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</NextLink></li>
                <li><NextLink href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</NextLink></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@webbuddy.agency" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</a></li>
                <li><a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} JujuLab.ai. All rights reserved.
            </p>
          </div>
        </div>
      </footer >
    </>
  );
}
