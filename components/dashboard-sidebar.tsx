"use client";

import { useState, useMemo, memo, useEffect, useCallback, useRef } from "react";
import { useUser, SignOutButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import NextLink from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  FileText,
  BarChart3,
  TrendingUp,
  Settings,
  ChevronDown,
  Archive,
  Menu,
  X,
  Image as ImageIcon,
  Video,
  Calculator,
  BookOpen,
  ScrollText,
  MessageSquare,
  Wrench,
  Coins,
  Languages,
  Code2,
  Dumbbell,
  GraduationCap
} from "lucide-react";

interface DashboardSidebarProps {
  className?: string;
}

// Logo component with fallback
function LogoWithFallback() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="text-2xl font-bold" style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 700 }}>
        <span className="text-white">By</span>Pass<span className="text-white">AI</span>
      </div>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="ByLearn Logo"
      width={120}
      height={32}
      className="h-8 w-auto"
      onError={() => setImageError(true)}
      priority
    />
  );
}

function DashboardSidebar({ className = "" }: DashboardSidebarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCodeLearnOpen, setIsCodeLearnOpen] = useState(false);
  const [isFetchingTools, setIsFetchingTools] = useState(true);
  const [activatedTools, setActivatedTools] = useState<string[]>([]);
  const { isLoaded, user } = useUser();
  const pathname = usePathname();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load activated tools with debouncing
  const loadActivatedTools = useCallback(async () => {
    setIsFetchingTools(true);
    try {
      const response = await fetch('/api/tools/status');
      if (response.ok) {
        const data = await response.json();
        const tools = data.tools || {};
        const activated = Object.entries(tools)
          .filter(([_, status]: [string, any]) => status.activated)
          .map(([toolId]) => toolId);
        setActivatedTools(activated);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading activated tools:', error);
      }
    } finally {
      setIsFetchingTools(false);
    }
  }, []);

  // Load activated tools on mount and user change
  useEffect(() => {
    if (user) {
      loadActivatedTools();
    }
  }, [user, loadActivatedTools]);

  // Refresh on pathname change with debounce
  useEffect(() => {
    if (user) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        loadActivatedTools();
      }, 100);
    }
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [pathname, user, loadActivatedTools]);

  // Listen for tool updates
  useEffect(() => {
    const handleToolUpdate = () => {
      if (user) {
        loadActivatedTools();
      }
    };
    window.addEventListener('toolPurchased', handleToolUpdate);
    window.addEventListener('toolActivated', handleToolUpdate);
    window.addEventListener('toolDeactivated', handleToolUpdate);
    window.addEventListener('creditsUpdated', handleToolUpdate);
    return () => {
      window.removeEventListener('toolPurchased', handleToolUpdate);
      window.removeEventListener('toolActivated', handleToolUpdate);
      window.removeEventListener('toolDeactivated', handleToolUpdate);
      window.removeEventListener('creditsUpdated', handleToolUpdate);
    };
  }, [user, loadActivatedTools]);

  // Memoize navigation items
  const navigationItems = useMemo(() => {
    const items = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        isActive: pathname === "/dashboard",
        alwaysShow: true
      },
      {
        name: "AI Humanize",
        href: "/dashboard/ai-humanize",
        icon: FileText,
        isActive: pathname === "/dashboard/ai-humanize",
        alwaysShow: true
      },
      {
        name: "AI Detector",
        href: "/dashboard/ai-detector",
        icon: BarChart3,
        isActive: pathname === "/dashboard/ai-detector",
        alwaysShow: true
      },
      {
        name: "AI Image Detection",
        href: "/dashboard/ai-image-detection",
        icon: ImageIcon,
        isActive: pathname === "/dashboard/ai-image-detection",
        toolId: "ai-image-detection"
      },
      {
        name: "AI Video Detection",
        href: "/dashboard/ai-video-detection",
        icon: Video,
        isActive: pathname === "/dashboard/ai-video-detection",
        toolId: "ai-video-detection"
      },
      {
        name: "AI Math Solver",
        href: "/dashboard/ai-math-solver",
        icon: Calculator,
        isActive: pathname === "/dashboard/ai-math-solver",
        toolId: "ai-math-solver"
      },
      {
        name: "AI Homework Helper",
        href: "/dashboard/ai-homework-helper",
        icon: BookOpen,
        isActive: pathname === "/dashboard/ai-homework-helper",
        toolId: "ai-homework-helper"
      },
      {
        name: "Summarizer",
        href: "/dashboard/summarizer",
        icon: ScrollText,
        isActive: pathname === "/dashboard/summarizer",
        toolId: "summarizer"
      },
      {
        name: "CodeLearn",
        icon: Code2,
        isDropdown: true,
        isActive: pathname?.startsWith("/dashboard/coding"),
        subItems: [
          {
            name: "Code Translator",
            href: "/dashboard/coding/translator",
            icon: Languages,
            isActive: pathname === "/dashboard/coding/translator",
            toolId: "code-translator"
          },
          {
            name: "AI Lessons",
            href: "/dashboard/coding/lessons",
            icon: GraduationCap,
            isActive: pathname?.startsWith("/dashboard/coding/lessons"),
            toolId: "ai-lessons"
          },
          {
            name: "AI Practice",
            href: "/dashboard/coding/practice",
            icon: Dumbbell,
            isActive: pathname?.startsWith("/dashboard/coding/practice"),
            toolId: "ai-practice"
          },
          {
            name: "AI Tutor",
            href: "/dashboard/coding/tutor",
            icon: Code2,
            isActive: pathname === "/dashboard/coding/tutor",
            toolId: "ai-tutor"
          }
        ]
      },
      {
        name: "Ask AI",
        href: "/dashboard/ask-ai",
        icon: MessageSquare,
        isActive: pathname === "/dashboard/ask-ai",
        alwaysShow: true
      },
      {
        name: "AI Tools",
        href: "/dashboard/ai-tools",
        icon: Wrench,
        isActive: pathname === "/dashboard/ai-tools" || pathname?.startsWith("/dashboard/ai-tools/"),
        alwaysShow: true
      },
      {
        name: "Documents",
        href: "/dashboard/documents",
        icon: Archive,
        isActive: pathname === "/dashboard/documents",
        alwaysShow: true
      },
      {
        name: "Market",
        href: "/dashboard/market",
        icon: TrendingUp,
        isActive: pathname === "/dashboard/market",
        alwaysShow: true
      },
      {
        name: "Credits",
        href: "/dashboard/credits",
        icon: Coins,
        isActive: pathname === "/dashboard/credits",
        alwaysShow: true
      }
    ];

    return items.map(item => {
      if (item.subItems) {
        return {
          ...item,
          visibleSubItems: item.subItems.filter(sub => (sub as any).alwaysShow || (sub.toolId && activatedTools.includes(sub.toolId)))
        };
      }
      return item;
    }).filter(item => {
      if ((item as any).alwaysShow) return true;
      if (item.isDropdown) return (item as any).visibleSubItems.length > 0;
      if (item.toolId) {
        return activatedTools.includes(item.toolId);
      }
      return true;
    });
  }, [pathname, activatedTools]);

  // Auto-open dropdown if active
  useEffect(() => {
    if (pathname?.startsWith("/dashboard/coding")) {
      setIsCodeLearnOpen(true);
    }
  }, [pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-black/90 backdrop-blur-xl text-white z-50 border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${className}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <LogoWithFallback />
              
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {(isFetchingTools || !isLoaded) ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/5 animate-pulse">
                    <div className="w-5 h-5 bg-white/10 rounded" />
                    <div className="h-4 bg-white/10 rounded w-24" />
                  </div>
                ))}
              </div>
            ) : (
              navigationItems.map((item) => {
                const Icon = item.icon;

                if (item.isDropdown) {
                  const subItems = (item as any).visibleSubItems;
                  return (
                    <div key={item.name} className="space-y-1">
                      <button
                        onClick={() => setIsCodeLearnOpen(!isCodeLearnOpen)}
                        className={`
                          w-full group relative flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                          ${item.isActive
                            ? 'bg-white/10 text-white'
                            : 'text-gray-300 hover:bg-white hover:text-black'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 transition-colors ${item.isActive ? 'text-white' : 'group-hover:text-black'}`} />
                          <span className={`text-sm font-medium transition-colors ${item.isActive ? 'text-white' : 'group-hover:text-black'}`}>{item.name}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCodeLearnOpen ? 'rotate-180' : ''} ${item.isActive ? 'text-white' : 'group-hover:text-black'}`} />
                      </button>

                      <AnimatePresence>
                        {isCodeLearnOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden space-y-1 pl-4"
                          >
                            {subItems.map((sub: any) => {
                              const SubIcon = sub.icon;
                              return (
                                <NextLink
                                  key={sub.name}
                                  href={sub.href}
                                  className={`
                                    group relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                                    ${sub.isActive
                                      ? 'bg-white text-black shadow-md'
                                      : 'text-gray-400 hover:bg-white hover:text-black'
                                    }
                                  `}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <SubIcon className={`w-4 h-4 transition-colors ${sub.isActive ? 'text-black' : 'group-hover:text-black'}`} />
                                  <span className={`text-xs font-medium transition-colors ${sub.isActive ? 'text-black' : 'group-hover:text-black'}`}>{sub.name}</span>

                                  {sub.isActive && (
                                    <motion.div
                                      layoutId="activeIndicatorSub"
                                      className="absolute inset-0 bg-white rounded-lg -z-10"
                                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                  )}
                                </NextLink>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <NextLink
                    key={item.name}
                    href={item.href || "#"}
                    className={`
                      group relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${item.isActive
                        ? 'bg-white text-black shadow-md'
                        : 'text-gray-300 hover:bg-white hover:text-black'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className={`w-5 h-5 transition-colors ${item.isActive ? 'text-black' : 'group-hover:text-black'}`} />
                    <span className={`text-sm font-medium transition-colors ${item.isActive ? 'text-black' : 'group-hover:text-black'}`}>{item.name}</span>

                    {item.isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 bg-white rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </NextLink>
                );
              })
            )}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="relative">
              {!isLoaded ? (
                <div className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/5 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-20" />
                    <div className="h-3 bg-white/10 rounded w-32" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-semibold backdrop-blur-sm">
                    {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {user?.firstName || 'User'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
              )}

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={() => setIsProfileOpen(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-black/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 z-50 overflow-hidden"
                  >
                    <div className="p-2">
                      <NextLink
                        href="/dashboard/profile"
                        className="flex items-center space-x-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </NextLink>

                      <NextLink
                        href="/dashboard/market"
                        className="flex items-center space-x-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>Market & Billing</span>
                      </NextLink>

                      <div className="border-t border-white/20 my-1"></div>

                      <SignOutButton>
                        <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                      </SignOutButton>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default memo(DashboardSidebar);
