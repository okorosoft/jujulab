 
import { getUserPlan } from "@/lib/get-user-plan";

export default async function AccountPage() {
  const planData = await getUserPlan();

  if (!planData) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        <h1 className="text-2xl font-bold">Not signed in</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-6">Account Overview</h1>

        <div className="space-y-4 text-lg">
          <p>
            <span className="font-semibold">Plan:</span> {planData.plan}
          </p>
          <p>
            <span className="font-semibold">Monthly Credits:</span>{" "}
            {planData.monthlyCredits}
          </p>
          <p>
            <span className="font-semibold">Credits Remaining:</span>{" "}
            {planData.creditsRemaining}
          </p>
          <p>
            <span className="font-semibold">Tool Access:</span>{" "}
            {Array.isArray(planData.toolAccess)
              ? planData.toolAccess.join(", ")
              : planData.toolAccess}
          </p>
          <p>
            <span className="font-semibold">Last Reset:</span>{" "}
            {planData.lastReset || "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import NextLink from "next/link";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileText,
  GraduationCap,
  Languages,
  Menu,
  MessageSquare,
  PenTool,
  ScrollText,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  Crown,
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "AI Study Help",
    description:
      "Get instant explanations, revision help, and guided answers across subjects whenever you need support.",
  },
  {
    icon: Calculator,
    title: "Step-by-Step Math Solver",
    description:
      "Solve equations and understand the process with clear breakdowns instead of just final answers.",
  },
  {
    icon: ScrollText,
    title: "Smart Summaries",
    description:
      "Turn long notes, PDFs, and reading materials into simple summaries for faster revision.",
  },
  {
    icon: PenTool,
    title: "Writing Assistant",
    description:
      "Improve grammar, structure, tone, and clarity for essays, assignments, and academic writing.",
  },
  {
    icon: Code2,
    title: "Coding Support",
    description:
      "Use AI for code explanation, debugging help, lessons, and programming practice.",
  },
  {
    icon: Languages,
    title: "Translation Tools",
    description:
      "Translate study content into multiple languages while keeping meaning and context clear.",
  },
];

const tools = [
  "Ask AI",
  "Homework Helper",
  "Math Solver",
  "Summarizer",
  "Writing Assistant",
  "Grammar Check",
  "Spell Check",
  "Translator",
  "Plagiarism Check",
  "Code Translator",
  "Coding Lessons",
  "Coding Tutor",
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    badge: "Get started",
    credits: "30 credits / month",
    description:
      "Try Jujulab and get a feel for your AI learning companion.",
    features: [
      "30 monthly credits",
      "Access to selected tools",
      "Good for testing the platform",
      "Credits reset monthly",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$15",
    badge: "Most Popular",
    credits: "700 credits / month",
    description:
      "For students who need regular help with homework, writing, summaries, math, and study support.",
    features: [
      "700 monthly credits",
      "Access to core learning tools",
      "Math tutor, AI companion, writing help, and summaries",
      "Credits reset monthly",
    ],
    highlight: true,
  },
  {
    name: "Elite",
    price: "$20",
    badge: "Best Value",
    credits: "1500 credits / month",
    description:
      "For serious learners who want more credits, deeper support, and access across the full Jujulab workspace.",
    features: [
      "1500 monthly credits",
      "Access to all tools",
      "Video summaries, file summaries, AI humanizer, coding help, and more",
      "Credits reset monthly",
    ],
    highlight: false,
  },
];

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
      "No. Credits reset monthly based on your active plan.",
  },
];

function CTAButtons({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) {
    return (
      <div className="flex flex-col sm:flex-row gap-4">
        <NextLink
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-black font-semibold hover:bg-gray-100 transition"
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </NextLink>
        <a
          href="#pricing"
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-white font-semibold hover:bg-white/10 transition"
        >
          View Pricing
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <SignUpButton mode="modal">
        <button className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-black font-semibold hover:bg-gray-100 transition">
          Start Free
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </SignUpButton>
      <SignInButton mode="modal">
        <button className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-white font-semibold hover:bg-white/10 transition">
          Sign In
        </button>
      </SignInButton>
    </div>
  );
}

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Jujulab",
    description:
      "Jujulab is an AI learning workspace for studying, homework help, math solving, writing support, summaries, translation, and coding tools.",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web Browser",
    url: "http://localhost:3000",
    author: {
      "@type": "Organization",
      name: "Jujulab",
    },
    publisher: {
      "@type": "Organization",
      name: "Jujulab",
      url: "http://localhost:3000",
    },
    offers: pricingPlans.map((plan) => ({
      "@type": "Offer",
      price: plan.price.replace("$", ""),
      priceCurrency: "USD",
      category: plan.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-black text-white">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <NextLink href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold">
                J
              </div>
              <div>
                <div className="text-lg font-bold">Jujulab</div>
                <div className="text-xs text-gray-400">AI Learning Workspace</div>
              </div>
            </NextLink>

            <nav className="hidden items-center gap-8 md:flex">
              <a href="#features" className="text-sm text-gray-300 hover:text-white">
                Features
              </a>
              <a href="#tools" className="text-sm text-gray-300 hover:text-white">
                Tools
              </a>
              <a href="#pricing" className="text-sm text-gray-300 hover:text-white">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-gray-300 hover:text-white">
                FAQ
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {isSignedIn ? (
                <NextLink
                  href="/dashboard"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/5"
                >
                  Dashboard
                </NextLink>
              ) : (
                <SignInButton mode="modal">
                  <button className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/5">
                    Sign In
                  </button>
                </SignInButton>
              )}

              {isSignedIn ? (
                <NextLink
                  href="/dashboard"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100"
                >
                  Get Started
                </NextLink>
              ) : (
                <SignUpButton mode="modal">
                  <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100">
                    Get Started
                  </button>
                </SignUpButton>
              )}
            </div>

            <button
              className="md:hidden rounded-xl border border-white/10 p-2"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="border-t border-white/10 px-4 py-4 md:hidden">
              <div className="flex flex-col gap-4">
                <a href="#features" onClick={() => setMobileOpen(false)} className="text-gray-300">
                  Features
                </a>
                <a href="#tools" onClick={() => setMobileOpen(false)} className="text-gray-300">
                  Tools
                </a>
                <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-gray-300">
                  Pricing
                </a>
                <a href="#faq" onClick={() => setMobileOpen(false)} className="text-gray-300">
                  FAQ
                </a>
              </div>
            </div>
          )}
        </header>

        <main>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_35%)]" />
            <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
              <div className="mx-auto max-w-4xl text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
                  <Sparkles className="h-4 w-4" />
                  AI tools for learning, writing, and coding
                </div>

                <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl">
                  Jujulab helps you
                  <span className="block text-gray-300">study smarter with AI</span>
                </h1>

                <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-400 sm:text-xl">
                  Get instant homework help, step-by-step solutions, AI tutoring, summaries,
                  writing support, translation, and coding tools — all in one workspace.
                </p>

                <div className="mt-10 flex justify-center">
                  <CTAButtons isSignedIn={!!isSignedIn} />
                </div>

                <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
                  {[
                    {
                      icon: ShieldCheck,
                      label: "Built for learners",
                      text: "Designed for study, revision, writing, and skill growth.",
                    },
                    {
                      icon: Zap,
                      label: "Fast support",
                      text: "Get help instantly without waiting for office hours.",
                    },
                    {
                      icon: Brain,
                      label: "Clear explanations",
                      text: "Understand concepts better instead of memorizing blindly.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5"
                    >
                      <item.icon className="mb-3 h-5 w-5 text-white" />
                      <div className="font-semibold">{item.label}</div>
                      <div className="mt-1 text-sm text-gray-400">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="border-t border-white/10 bg-[#050505] py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto mb-14 max-w-3xl text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
                  <BookOpen className="h-4 w-4" />
                  Core features
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Everything you need in one learning workspace
                </h2>
                <p className="mt-4 text-lg text-gray-400">
                  Jujulab combines academic support, writing help, research tools, and coding assistance in one place.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/8 transition"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="tools" className="border-t border-white/10 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto mb-14 max-w-3xl text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
                  <MessageSquare className="h-4 w-4" />
                  Included tools
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Use the tools that match your workflow
                </h2>
                <p className="mt-4 text-lg text-gray-400">
                  From homework and math to writing and code, Jujulab supports your full learning process.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <div
                    key={tool}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                    <span className="text-sm text-gray-200">{tool}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="pricing" className="border-t border-white/10 bg-[#050505] py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto mb-14 max-w-3xl text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
                  <Crown className="h-4 w-4" />
                  Pricing
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Simple monthly plans
                </h2>
                <p className="mt-4 text-lg text-gray-400">
                  Choose a plan that matches your usage. Every plan comes with monthly credits.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {pricingPlans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-2xl p-8 border ${
                      plan.highlight
                        ? "border-white bg-white text-black shadow-xl"
                        : "border-white/10 bg-white/5 text-white"
                    }`}
                  >
                    <div className="text-sm uppercase tracking-[0.2em] opacity-80">
                      {plan.badge}
                    </div>
                    <h3 className="mt-3 text-2xl font-bold">{plan.name}</h3>
                    <div className="mt-4 text-4xl font-bold">
                      {plan.price}
                      <span className="text-base font-medium opacity-70">/month</span>
                    </div>
                    <p className="mt-3 text-sm opacity-80">{plan.description}</p>

                    <div className="mt-5 rounded-xl border border-current/10 px-4 py-3 text-sm font-semibold">
                      {plan.credits}
                    </div>

                    <ul className="mt-6 space-y-3 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      {isSignedIn ? (
                        <NextLink
                          href="/dashboard"
                          className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-semibold transition ${
                            plan.highlight
                              ? "bg-black text-white hover:bg-neutral-800"
                              : "bg-white text-black hover:bg-gray-100"
                          }`}
                        >
                          Choose {plan.name}
                        </NextLink>
                      ) : (
                        <SignUpButton mode="modal">
                          <button
                            className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-semibold transition ${
                              plan.highlight
                                ? "bg-black text-white hover:bg-neutral-800"
                                : "bg-white text-black hover:bg-gray-100"
                            }`}
                          >
                            Choose {plan.name}
                          </button>
                        </SignUpButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="faq" className="border-t border-white/10 py-20">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
                  <FileText className="h-4 w-4" />
                  FAQ
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Questions people ask about Jujulab
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => {
                  const open = openFaq === index;
                  return (
                    <div
                      key={faq.question}
                      className="rounded-2xl border border-white/10 bg-white/5"
                    >
                      <button
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                        onClick={() => setOpenFaq(open ? null : index)}
                      >
                        <span className="font-semibold">{faq.question}</span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <div className="px-6 pb-6 text-sm leading-7 text-gray-400">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="border-t border-white/10 bg-[#050505] py-20">
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-14 sm:px-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
                  <Sparkles className="h-4 w-4" />
                  Start now
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Learn, write, and build better with Jujulab
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-gray-400">
                  Join Jujulab and use AI to stay ahead in school, research, writing, and coding.
                </p>

                <div className="mt-8 flex justify-center">
                  <CTAButtons isSignedIn={!!isSignedIn} />
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <div className="text-lg font-bold">Jujulab</div>
              <div className="mt-1 text-sm text-gray-500">
                Your AI companion for studying, homework, writing, coding, file summaries, video summaries, and guided learning.
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-white">
                Features
              </a>
              <a href="#tools" className="hover:text-white">
                Tools
              </a>
              <a href="#pricing" className="hover:text-white">
                Pricing
              </a>
              <a href="#faq" className="hover:text-white">
                FAQ
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}