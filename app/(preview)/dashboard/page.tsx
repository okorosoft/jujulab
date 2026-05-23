"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import { useUsageTracking } from "@/lib/hooks/useUsageTracking";
import { getUserSubscription } from "@/lib/stripe";
import { getSubscriptionLimits } from "@/lib/subscription-utils";
import Lottie from 'lottie-react';
import loadingAnimation from '@/lib/data/Loading.json';
import { 
  FileText, 
  File, 
  Clock,
  TrendingUp,
  BarChart3,
  ChevronDown,
  Gift,
  Star,
  Building,
  PieChart,
  Brain,
  Target,
  Sparkles,
  History,
  Zap,
  ArrowRight,
  Code,
  Languages,
  BookOpen,
  MessageSquare,
  Calculator,
  Eye,
  Video as VideoIcon,
  Coins,
  AlertTriangle
} from 'lucide-react';
import { TOOL_CATEGORIES } from '@/lib/tool-usage-tracker';
import { useRouter } from 'next/navigation';
import { ALL_TOOLS } from '@/lib/tool-definitions';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLimits, setSubscriptionLimits] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [toolUsage, setToolUsage] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [mostUsedTool, setMostUsedTool] = useState<any>(null);
  const [toolCredits, setToolCredits] = useState<Record<string, number>>({});
  const [categoryUsage, setCategoryUsage] = useState<Record<string, { count: number; wordsProcessed: number }>>({});
  
  // Get usage data from the hook
  const { usage, limits, isLoading: usageLoading, error: usageError, refreshUsage } = useUsageTracking();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/';
    }
  }, [isLoaded, isSignedIn]);

  // Load all data in parallel for faster loading
  useEffect(() => {
    if (!isSignedIn || !user) return;

    // Load analytics and subscription data in parallel
    const loadAllData = async () => {
      const [analyticsResponse, subscriptionData] = await Promise.allSettled([
        fetch('/api/analytics').then(res => res.ok ? res.json() : null),
        Promise.resolve(getUserSubscription(user)).catch(() => null)
      ]);

      // Set analytics data
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value) {
        setAnalytics(analyticsResponse.value);
      }
      setAnalyticsLoading(false);

      // Set subscription data
      if (subscriptionData.status === 'fulfilled' && subscriptionData.value) {
        setSubscription(subscriptionData.value);
        setSubscriptionLimits(getSubscriptionLimits(user));
      }
      setSubscriptionLoading(false);

      // Load tool usage data from API (user-specific)
      const [usageResponse, recentResponse, breakdownResponse] = await Promise.allSettled([
        fetch('/api/tool-usage/stats').then(res => res.ok ? res.json() : null),
        fetch('/api/tool-usage/recent').then(res => res.ok ? res.json() : null),
        fetch('/api/tool-usage/breakdown').then(res => res.ok ? res.json() : null)
      ]);
      
      if (usageResponse.status === 'fulfilled' && usageResponse.value) {
        setToolUsage(usageResponse.value.usage || []);
        setMostUsedTool(usageResponse.value.usage?.[0] || null);
      }
      
      if (recentResponse.status === 'fulfilled' && recentResponse.value) {
        setRecentActivities(recentResponse.value.activities || []);
      }
      
      if (breakdownResponse.status === 'fulfilled' && breakdownResponse.value) {
        setCategoryUsage(breakdownResponse.value.breakdown || {});
      }
      
      // Load tool credits
      const creditsResponse = await fetch('/api/credits/status');
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setToolCredits(creditsData.credits || {});
      }
    };

    loadAllData();
    
    // Refresh tool usage data and credits periodically
    const interval = setInterval(() => {
      // Refresh tool usage from API (user-specific)
      Promise.all([
        fetch('/api/tool-usage/stats').then(res => res.ok ? res.json() : null),
        fetch('/api/tool-usage/recent').then(res => res.ok ? res.json() : null),
        fetch('/api/tool-usage/breakdown').then(res => res.ok ? res.json() : null)
      ]).then(([usageData, recentData, breakdownData]) => {
        if (usageData) {
          setToolUsage(usageData.usage || []);
          setMostUsedTool(usageData.usage?.[0] || null);
        }
        if (recentData) {
          setRecentActivities(recentData.activities || []);
        }
        if (breakdownData) {
          setCategoryUsage(breakdownData.breakdown || {});
        }
      }).catch(err => console.error('Error refreshing tool usage:', err));
      
      // Refresh credits
      fetch('/api/credits/status')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setToolCredits(data.credits || {});
          }
        })
        .catch(err => console.error('Error refreshing credits:', err));
    }, 2000); // Refresh every 2 seconds
    
    return () => clearInterval(interval);
  }, [isSignedIn, user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUsage();
      if (user) {
        const subData = await getUserSubscription(user);
        setSubscription(subData);
        setSubscriptionLimits(getSubscriptionLimits(user));
      }
      // Refresh analytics
      setAnalyticsLoading(true);
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
      setAnalyticsLoading(false);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate metrics with fallback - use MongoDB analytics data if available (includes both humanize and detect)
  const totalWords = analytics?.metrics?.wordsProcessed || usage?.total || user?.publicMetadata?.totalWords || 0;
  const totalLimit = limits?.total || (subscriptionLimits?.maxWordsPerMonth === -1 ? null : subscriptionLimits?.maxWordsPerMonth) || 100;
  const remainingWords = totalLimit ? Math.max(0, Number(totalLimit) - Number(totalWords)) : 0;
  
  // Get plan name
  const planName = subscription?.planName || 'free';
  const planDisplayName = planName.charAt(0).toUpperCase() + planName.slice(1);

  // Show loading only if Clerk is not loaded or user is not signed in
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-64 h-64 md:w-96 md:h-96 mx-auto mb-4">
            <Lottie 
              animationData={loadingAnimation} 
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <p className="text-gray-300 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />

      <div className="lg:pl-64 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-gray-400">
                Here&apos;s what&apos;s happening with your account.
              </p>
            </div>
            
            {/* Super Saving Plan Component */}
              {(() => {
              // Check if user has Super Saving Plan
              // Super Saving Plan gives credits to all 17 tools, so check if they have credits for most/all tools
              const allToolIds = ALL_TOOLS.map(tool => tool.id);
              const toolsWithCredits = allToolIds.filter(toolId => (toolCredits[toolId] || 0) > 0);
              // If they have credits for 15+ tools (out of 17), they likely have Super Saving Plan
              const hasSuperSavingPlan = toolsWithCredits.length >= 15;
              
              if (!hasSuperSavingPlan) {
                return null; // Don't show plan component if no Super Saving Plan
              }
              
              // Calculate average credits per tool (Super Saving Plan gives 10K per tool)
              const creditsPerTool = allToolIds.map(toolId => toolCredits[toolId] || 0);
              const avgCredits = creditsPerTool.reduce((sum, credits) => sum + credits, 0) / allToolIds.length;
              const totalCredits = creditsPerTool.reduce((sum, credits) => sum + credits, 0);
                
              const formatCredits = (credits: number) => {
                if (credits >= 1000000) {
                  return `${(credits / 1000000).toFixed(1)}M`;
                }
                if (credits >= 1000) {
                  return `${(credits / 1000).toFixed(1)}K`;
                }
                return credits.toLocaleString();
              };
                
                return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-yellow-400/20 flex items-center space-x-4"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-yellow-400/20">
                    <Coins className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                    <div className="text-xs text-yellow-400 mb-1 font-medium">
                      Super Saving Plan
                      </div>
                      <div className="text-xl font-bold text-white">
                      {formatCredits(Math.round(avgCredits))} / tool
                      </div>
                      <div className="text-xs text-gray-400">
                      {formatCredits(totalCredits)} total • {toolsWithCredits.length} tools active
                      </div>
                    </div>
                </motion.div>
                );
              })()}
          </motion.div>

          {/* Analytics Cards */}
          {analyticsLoading ? (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-lg border border-white/10 animate-pulse">
                  <div className="h-12 w-12 bg-white/10 rounded-xl mb-4"></div>
                  <div className="h-8 bg-white/10 rounded mb-2 w-24"></div>
                  <div className="h-4 bg-white/10 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : analytics ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-8"
            >
              {[
                {
                  title: 'Words Processed',
                  value: analytics.metrics.wordsProcessed.toLocaleString(),
                  change: analytics.changes.wordsPercent,
                  icon: FileText,
                  bgColor: 'bg-white/20',
                },
                {
                  title: 'Documents Created',
                  value: analytics.metrics.documentsCreated,
                  change: analytics.changes.documentsPercent,
                  icon: File,
                  bgColor: 'bg-white/15',
                },
                {
                  title: 'Time Saved',
                  value: `${analytics.metrics.timeSaved} hrs`,
                  change: analytics.changes.timePercent,
                  icon: Clock,
                  bgColor: 'bg-white/10',
                },
                {
                  title: 'Images Detected',
                  value: (analytics.metrics.imageDetectionCount || 0).toLocaleString(),
                  change: '0%',
                  icon: Eye,
                  bgColor: 'bg-orange-500/20',
                },
                {
                  title: 'Videos Detected',
                  value: (analytics.metrics.videoDetectionCount || 0).toLocaleString(),
                  change: '0%',
                  icon: VideoIcon,
                  bgColor: 'bg-red-500/20',
                },
              ].map((card, index) => {
                const Icon = card.icon;
                const isPositive = card.change.startsWith('+');
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`flex items-center text-sm font-medium ${
                        isPositive ? 'text-gray-300' : 'text-gray-400'
                      }`}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {card.change}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {card.value}
                    </div>
                    <div className="text-sm text-gray-400">{card.title}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : null}

          {/* Most Used Tool & Quick Access */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Most Used Tool Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10"
          >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Most Used Tool</h3>
              </div>
              {mostUsedTool ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                      <Brain className="w-8 h-8 text-white" />
            </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white">{mostUsedTool.toolName}</h4>
                      <p className="text-sm text-gray-400">{mostUsedTool.category}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-2xl font-bold text-white">{mostUsedTool.count}</div>
                      <div className="text-sm text-gray-400">Times Used</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{mostUsedTool.wordsProcessed.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Words Processed</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">Start using tools to see your most used tool here</p>
                </div>
              )}
            </motion.div>

            {/* Quick Access Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10"
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Quick Access</h3>
              </div>
              <div className="space-y-2">
                {toolUsage.slice(0, 4).map((tool, index) => {
                  const getToolRoute = (toolId: string) => {
                    if (toolId === 'humanize') return '/dashboard/ai-humanize';
                    if (toolId === 'detect') return '/dashboard/ai-detector';
                    if (toolId.includes('summarizer')) return '/dashboard/summarizer';
                    if (toolId === 'ask-ai') return '/dashboard/ask-ai';
                    if (toolId === 'ai-homework-helper') return '/dashboard/ai-homework-helper';
                    if (toolId === 'ai-math-solver') return '/dashboard/ai-math-solver';
                    if (toolId === 'ai-image-detection') return '/dashboard/ai-image-detection';
                    if (toolId === 'ai-video-detection') return '/dashboard/ai-video-detection';
                    return `/dashboard/ai-tools/${toolId}`;
                  };

                  return (
                    <button
                      key={tool.toolId}
                      onClick={() => router.push(getToolRoute(tool.toolId))}
                      className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="text-white font-medium">{tool.toolName}</div>
                          <div className="text-xs text-gray-400">{tool.count} uses</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                  );
                })}
                {toolUsage.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">No tools used yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10 mb-8"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-md">
                <History className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            </div>
            {recentActivities.length > 0 ? (
              <div className="space-y-2">
                {recentActivities.slice(0, 5).map((activity, index) => {
                  const getToolRoute = (toolId: string) => {
                    if (toolId === 'humanize') return '/dashboard/ai-humanize';
                    if (toolId === 'detect') return '/dashboard/ai-detector';
                    if (toolId.includes('summarizer')) return '/dashboard/summarizer';
                    if (toolId === 'ask-ai') return '/dashboard/ask-ai';
                    if (toolId === 'ai-homework-helper') return '/dashboard/ai-homework-helper';
                    if (toolId === 'ai-math-solver') return '/dashboard/ai-math-solver';
                    if (toolId === 'ai-image-detection') return '/dashboard/ai-image-detection';
                    if (toolId === 'ai-video-detection') return '/dashboard/ai-video-detection';
                    return `/dashboard/ai-tools/${toolId}`;
                  };
              
                  const timeAgo = (() => {
                    const now = new Date();
                    const then = new Date(activity.timestamp);
                    const diffMs = now.getTime() - then.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                  })();

                  return (
                    <button
                      key={index}
                      onClick={() => router.push(getToolRoute(activity.toolId))}
                      className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="text-white font-medium">{activity.toolName}</div>
                          <div className="text-xs text-gray-400">
                            {activity.wordsProcessed > 0 ? `${activity.wordsProcessed} words` : activity.category} • {timeAgo}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No recent activity</p>
              </div>
            )}
          </motion.div>

          {/* Tool Credits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-lg border border-white/10 mt-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-md backdrop-blur-sm">
                  <Coins className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Tool Credits</h3>
              </div>
              <button
                onClick={() => router.push('/dashboard/credits')}
                className="px-4 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors border border-yellow-400/30"
              >
                Buy Credits
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {ALL_TOOLS.map((tool) => {
                const credits = toolCredits[tool.id] || 0;
                
                const formatCredits = (amount: number, toolId: string) => {
                  if (toolId === 'ai-image-detection') {
                    return `${amount} ${amount === 1 ? 'image' : 'images'}`;
                  }
                  if (toolId === 'ai-video-detection') {
                    return `${amount} ${amount === 1 ? 'video' : 'videos'}`;
                  }
                  if (amount >= 1000000) {
                    return `${(amount / 1000000).toFixed(1)}M`;
                  }
                  if (amount >= 1000) {
                    return `${(amount / 1000).toFixed(1)}K`;
                  }
                  return amount.toLocaleString();
                };
                
                const getCreditColor = (amount: number, toolId: string) => {
                  if (toolId === 'ai-image-detection') {
                    if (amount > 10) return 'text-green-400';
                    if (amount > 5) return 'text-yellow-400';
                    if (amount > 0) return 'text-orange-400';
                    return 'text-red-400';
                  }
                  if (toolId === 'ai-video-detection') {
                    if (amount > 4) return 'text-green-400';
                    if (amount > 2) return 'text-yellow-400';
                    if (amount > 0) return 'text-orange-400';
                    return 'text-red-400';
                  }
                  if (amount > 10000) return 'text-green-400';
                  if (amount > 1000) return 'text-yellow-400';
                  if (amount > 0) return 'text-orange-400';
                  return 'text-red-400';
                };

                const getProgressBarColor = (amount: number, toolId: string) => {
                  if (toolId === 'ai-image-detection') {
                    if (amount > 10) return 'bg-green-400';
                    if (amount > 5) return 'bg-yellow-400';
                    if (amount > 0) return 'bg-orange-400';
                    return 'bg-red-400';
                  }
                  if (toolId === 'ai-video-detection') {
                    if (amount > 4) return 'bg-green-400';
                    if (amount > 2) return 'bg-yellow-400';
                    if (amount > 0) return 'bg-orange-400';
                    return 'bg-red-400';
                  }
                  if (amount > 10000) return 'bg-green-400';
                  if (amount > 1000) return 'bg-yellow-400';
                  if (amount > 0) return 'bg-orange-400';
                  return 'bg-red-400';
                };

                const getProgressBarWidth = (amount: number, toolId: string) => {
                  if (toolId === 'ai-image-detection') return `${Math.min(100, (amount / 20) * 100)}%`;
                  if (toolId === 'ai-video-detection') return `${Math.min(100, (amount / 10) * 100)}%`;
                  return `${Math.min(100, (amount / 100000) * 100)}%`;
                };
                
                const getToolIcon = (iconName: string) => {
                  const iconMap: Record<string, any> = {
                    'FileText': FileText,
                    'BarChart3': BarChart3,
                    'Image': Eye,
                    'Video': VideoIcon,
                    'SpellCheck': FileText,
                    'FileCheck': FileText,
                    'CopyCheck': FileText,
                    'Languages': Languages,
                    'Code': Code,
                    'Hash': FileText,
                    'Type': FileText,
                    'ScrollText': FileText,
                    'MessageSquare': MessageSquare,
                    'BookOpen': BookOpen,
                    'Calculator': Calculator,
                  };
                  return iconMap[iconName] || FileText;
                };
                
                const IconComponent = getToolIcon(tool.icon);
                const getToolRoute = () => {
                  if (tool.id === 'ai-humanize') return '/dashboard/ai-humanize';
                  if (tool.id === 'ai-detector') return '/dashboard/ai-detector';
                  if (tool.id === 'summarizer') return '/dashboard/summarizer';
                  if (tool.id === 'ask-ai') return '/dashboard/ask-ai';
                  if (tool.id === 'ai-homework-helper') return '/dashboard/ai-homework-helper';
                  if (tool.id === 'ai-math-solver') return '/dashboard/ai-math-solver';
                  if (tool.id === 'ai-image-detection') return '/dashboard/ai-image-detection';
                  if (tool.id === 'ai-video-detection') return '/dashboard/ai-video-detection';
                  return `/dashboard/ai-tools/${tool.id}`;
                };
                
                return (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => router.push(getToolRoute())}
                    className="bg-gradient-to-br from-white/5 to-white/0 rounded-xl p-5 border border-white/10 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/10 transition-all cursor-pointer group backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${
                          tool.id === 'ai-image-detection' || tool.id === 'ai-video-detection'
                            ? credits > 0 ? 'bg-yellow-400/20 border border-yellow-400/30' : 'bg-white/10 border border-white/20'
                            : credits > 0 ? 'bg-blue-400/20 border border-blue-400/30' : 'bg-white/10 border border-white/20'
                        }`}>
                          <IconComponent className={`w-6 h-6 ${
                            tool.id === 'ai-image-detection' || tool.id === 'ai-video-detection'
                              ? credits > 0 ? 'text-yellow-400' : 'text-gray-400'
                              : credits > 0 ? 'text-blue-400' : 'text-gray-400'
                          }`} />
                  </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
                            {tool.name}
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {tool.id === 'ai-image-detection' ? 'Image detection' : 
                             tool.id === 'ai-video-detection' ? 'Video detection' : 
                             'Text processing'}
                          </p>
                      </div>
                        </div>
                        </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Remaining</span>
                        <span className={`text-lg font-bold ${getCreditColor(credits, tool.id)}`}>
                          {formatCredits(credits, tool.id)}
                        </span>
                      </div>
                      
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressBarColor(credits, tool.id)}`}
                          style={{ width: getProgressBarWidth(credits, tool.id) }}
                        />
                    </div>
                    
                      {credits === 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>No credits remaining</span>
                      </div>
                      )}
                        </div>
                  </motion.div>
                );
              })}
                        </div>
          </motion.div>

          {/* Usage Analytics - Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-lg border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-md backdrop-blur-sm">
                  <PieChart className="w-5 h-5 text-white" />
                      </div>
                <h3 className="text-lg font-bold text-white">Usage Breakdown</h3>
                    </div>
                  </div>
            
            {/* Pie Chart */}
            {analyticsLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-gray-400">Loading chart data...</p>
                </div>
              </div>
            ) : (() => {
              // Use user-specific category usage from state (loaded from API/database)
              const humanizeCount = analytics?.breakdown?.humanize || 0;
              const detectCount = analytics?.breakdown?.detect || 0;
              
              // Combine MongoDB data with API category usage (all user-specific)
              const categories = [
                { name: 'Humanization', count: humanizeCount, color: '#3b82f6', icon: Brain },
                { name: 'Detection', count: detectCount, color: '#8b5cf6', icon: Target },
                { name: 'Writing Tools', count: (categoryUsage['Writing Tools']?.count || 0), color: '#10b981', icon: FileText },
                { name: 'Translation', count: (categoryUsage['Translation']?.count || 0), color: '#f59e0b', icon: Languages },
                { name: 'Conversion Tools', count: (categoryUsage['Conversion Tools']?.count || 0), color: '#ef4444', icon: Code },
                { name: 'Summarizer', count: (categoryUsage['Summarizer']?.count || 0), color: '#06b6d4', icon: FileText },
                { name: 'AI Homework Helper', count: (categoryUsage['AI Homework Helper']?.count || 0), color: '#8b5cf6', icon: BookOpen },
                { name: 'AI Chat', count: (categoryUsage['AI Chat']?.count || 0), color: '#ec4899', icon: MessageSquare },
                { name: 'AI Math Solver', count: (categoryUsage['AI Math Solver']?.count || 0), color: '#6366f1', icon: Calculator },
                { name: 'AI Image Detection', count: (categoryUsage['AI Image Detection']?.count || 0), color: '#f59e0b', icon: Eye },
                { name: 'AI Video Detection', count: (categoryUsage['AI Video Detection']?.count || 0), color: '#ef4444', icon: VideoIcon },
              ].filter(cat => cat.count > 0);
              
              const total = categories.reduce((sum, cat) => sum + cat.count, 0);
              
              if (total === 0) {
                return (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                      <p className="text-sm text-gray-400">No usage data available. Start using tools to see your breakdown.</p>
                </div>
              </div>
                );
              }
              
              // Calculate percentages
              const categoryData = categories.map(cat => ({
                ...cat,
                percent: (cat.count / total) * 100
              }));
              
              return (
                <div className="space-y-4">
                  {categoryData.map((category, index) => {
                    const Icon = category.icon;
                    return (
                      <div key={category.name} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center border" style={{ backgroundColor: `${category.color}20`, borderColor: `${category.color}30` }}>
                          <Icon className="w-6 h-6" style={{ color: category.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold">{category.name}</span>
                            <span className="text-gray-400 text-sm">{category.percent.toFixed(1)}%</span>
                        </div>
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${category.percent}%`,
                                backgroundColor: category.color
                              }}
                            />
                      </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-400">{category.count.toLocaleString()} uses</span>
                            {categoryUsage[category.name]?.wordsProcessed > 0 && (
                              <span className="text-sm text-gray-400">{categoryUsage[category.name].wordsProcessed.toLocaleString()} words</span>
                            )}
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>

          {/* Words Usage Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-lg border border-white/10 mt-6"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-md backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Words Usage</h3>
              </div>
              <div className="flex items-center gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      timeRange === range
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Bar Chart */}
            {analyticsLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-gray-400">Loading chart data...</p>
                </div>
              </div>
            ) : analytics && (analytics.weeklyData || analytics.weeklyStats || analytics.monthlyStats) ? (() => {
              // Process data based on time range
              let chartData: { label: string; value: number; humanizeWords: number; detectWords: number }[] = [];
              
              if (timeRange === 'daily') {
                // Last 7 days
                if (analytics.weeklyData && analytics.weeklyData.length > 0) {
                  chartData = analytics.weeklyData.map((day: any) => ({
                    label: day.day,
                    value: day.words || 0,
                    humanizeWords: day.humanizeWords || 0,
                    detectWords: day.detectWords || 0
                  }));
                } else {
                  chartData = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    return {
                      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                      value: 0,
                      humanizeWords: 0,
                      detectWords: 0
                    };
                  });
                }
              } else if (timeRange === 'weekly') {
                // Last 4 weeks
                if (analytics.weeklyStats && analytics.weeklyStats.length > 0) {
                  chartData = analytics.weeklyStats.map((week: any) => ({
                    label: week.week,
                    value: week.words || 0,
                    humanizeWords: week.humanizeWords || 0,
                    detectWords: week.detectWords || 0
                  }));
                } else {
                  chartData = Array.from({ length: 4 }, (_, i) => ({
                    label: `Week ${i + 1}`,
                    value: 0,
                    humanizeWords: 0,
                    detectWords: 0
                  }));
                }
              } else {
                // Monthly (last 6 months)
                if (analytics.monthlyStats && analytics.monthlyStats.length > 0) {
                  chartData = analytics.monthlyStats.map((month: any) => ({
                    label: month.month,
                    value: month.words || 0,
                    humanizeWords: month.humanizeWords || 0,
                    detectWords: month.detectWords || 0
                  }));
                } else {
                  const now = new Date();
                  chartData = Array.from({ length: 6 }, (_, i) => {
                    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    return {
                      label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
                      value: 0,
                      humanizeWords: 0,
                      detectWords: 0
                    };
                  });
                }
              }
              
              // Calculate max value for scaling (consider both humanize and detect)
              const maxValue = Math.max(1, ...chartData.map(d => Math.max(d.humanizeWords || 0, d.detectWords || 0, d.value || 0)));
              
              return (
                <div className="relative">
                  <div className="h-96 flex gap-4">
                    {/* Y-axis Labels */}
                    <div className="flex flex-col justify-between pt-2 pb-8 min-w-[60px]">
                      {[0, 25, 50, 75, 100].map((percent) => {
                        const value = Math.round((maxValue * percent) / 100);
                        return (
                          <span key={percent} className="text-sm font-medium text-gray-400">
                            {value.toLocaleString()}
                          </span>
                        );
                      })}
                    </div>
                    
                    {/* Chart Area */}
                    <div className="flex-1 relative">
                      {/* Y-axis grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-8">
                        {[0, 25, 50, 75, 100].map((_, index) => (
                          <div key={index} className="border-t border-white/20"></div>
                        ))}
                      </div>
                      
                      {/* Bars - Grouped bars for humanize and detect */}
                      <div className="relative h-full flex items-end gap-2 pt-2 pb-8">
                        {chartData.map((data, index) => {
                          const humanizeHeight = ((data.humanizeWords || 0) / maxValue) * 100;
                          const detectHeight = ((data.detectWords || 0) / maxValue) * 100;
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                              className="flex-1 flex flex-col items-center group"
                            >
                              {/* Grouped Bars Container */}
                              <div className="w-full h-full flex items-end gap-1 relative">
                                {/* Humanize Bar */}
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${humanizeHeight}%` }}
                                  transition={{ duration: 0.6, delay: index * 0.1 }}
                                  className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-500/80 to-blue-400/60 hover:from-blue-500 hover:to-blue-400 transition-all duration-300 cursor-pointer relative"
                                  style={{ minHeight: humanizeHeight > 0 ? '4px' : '0' }}
                                  title={`Humanization: ${(data.humanizeWords || 0).toLocaleString()} words`}
                                >
                                  {/* Value label on hover */}
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                    <div className="bg-blue-500/90 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                                      Humanize: {(data.humanizeWords || 0).toLocaleString()}
                                    </div>
                                    <div className="w-2 h-2 bg-blue-500/90 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                                  </div>
                                </motion.div>
                                
                                {/* Detect Bar */}
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${detectHeight}%` }}
                                  transition={{ duration: 0.6, delay: index * 0.1 + 0.05 }}
                                  className="flex-1 rounded-t-lg bg-gradient-to-t from-purple-500/80 to-purple-400/60 hover:from-purple-500 hover:to-purple-400 transition-all duration-300 cursor-pointer relative"
                                  style={{ minHeight: detectHeight > 0 ? '4px' : '0' }}
                                  title={`Detection: ${(data.detectWords || 0).toLocaleString()} words`}
                                >
                                  {/* Value label on hover */}
                                  <div className="absolute -top-8 right-1/2 transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                    <div className="bg-purple-500/90 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                                      Detect: {(data.detectWords || 0).toLocaleString()}
                                    </div>
                                    <div className="w-2 h-2 bg-purple-500/90 transform rotate-45 absolute -bottom-1 right-1/2 translate-x-1/2"></div>
                                  </div>
                                </motion.div>
                              </div>
                              
                              {/* X-axis Label */}
                              <div className="mt-2 text-xs font-medium text-gray-400 text-center w-full">
                                {data.label}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-sm text-gray-400">Humanization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-500"></div>
                      <span className="text-sm text-gray-400">Detection</span>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-400">No usage data available</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
