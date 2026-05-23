"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import {
  Coins,
  Zap,
  ShoppingCart,
  Loader2,
  Sparkles,
  TrendingUp,
  Package,
  CheckCircle
} from "lucide-react";
import { toast } from 'sonner';
import { ALL_TOOLS, getPurchasableTools, getFreeTools, ToolDefinition } from '@/lib/tool-definitions';
import {
  FileText,
  BarChart3,
  Image,
  Video,
  SpellCheck,
  FileCheck,
  CopyCheck,
  Languages,
  Code,
  Hash,
  Type,
  ScrollText,
  MessageSquare,
  BookOpen,
  Calculator,
  Code2,
  GraduationCap,
  Terminal,
  UserCog
} from "lucide-react";

// Icon mapping
const iconMap: Record<string, any> = {
  'FileText': FileText,
  'BarChart3': BarChart3,
  'Image': Image,
  'Video': Video,
  'SpellCheck': SpellCheck,
  'FileCheck': FileCheck,
  'CopyCheck': CopyCheck,
  'Languages': Languages,
  'Code': Code,
  'Hash': Hash,
  'Type': Type,
  'ScrollText': ScrollText,
  'MessageSquare': MessageSquare,
  'BookOpen': BookOpen,
  'Calculator': Calculator,
  'Code2': Code2,
  'GraduationCap': GraduationCap,
  'Terminal': Terminal,
  'UserCog': UserCog,
};

interface ToolCredits {
  [toolId: string]: number;
}

export default function CreditsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [toolCredits, setToolCredits] = useState<ToolCredits>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [customCreditAmount, setCustomCreditAmount] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isSignedIn && user) {
      loadCredits();

      // Check for success/cancel parameters
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        const toolId = params.get('toolId');
        const type = params.get('type');
        const sessionId = params.get('session_id');

        toast.success('Verifying purchase...');

        // Immediately verify and update credit purchase status
        const verifyPurchase = async () => {
          try {
            const response = await fetch('/api/credits/verify-purchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                toolId: toolId || undefined,
                type: type || (toolId ? 'credit_purchase' : 'super_saving_plan'),
                sessionId
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.purchased) {
                // Reload credits
                await loadCredits();
                toast.success('Credits purchased successfully!');
                // Clean URL
                window.history.replaceState({}, '', '/dashboard/credits');
              } else {
                // Retry after a short delay (Stripe might still be processing)
                setTimeout(async () => {
                  const retryResponse = await fetch('/api/credits/verify-purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      toolId: toolId || undefined,
                      type: type || (toolId ? 'credit_purchase' : 'super_saving_plan'),
                      sessionId
                    }),
                  });
                  if (retryResponse.ok) {
                    const retryData = await retryResponse.json();
                    if (retryData.purchased) {
                      await loadCredits();
                      toast.success('Credits purchased successfully!');
                    } else {
                      toast.warning('Purchase is processing. Please refresh if credits don\'t update.');
                    }
                  }
                  // Clean URL after retry
                  window.history.replaceState({}, '', '/dashboard/credits');
                }, 2000);
              }
            } else {
              toast.warning('Purchase verification failed. Please refresh the page.');
              window.history.replaceState({}, '', '/dashboard/credits');
            }
          } catch (error) {
            console.error('Error verifying purchase:', error);
            toast.warning('Purchase verification failed. Please refresh the page.');
            window.history.replaceState({}, '', '/dashboard/credits');
          }
        };

        verifyPurchase();
      } else if (params.get('canceled') === 'true') {
        toast.info('Purchase canceled');
        window.history.replaceState({}, '', '/dashboard/credits');
      }
    }
  }, [isSignedIn, user]);

  const loadCredits = async () => {
    try {
      const response = await fetch('/api/credits/status');
      if (response.ok) {
        const data = await response.json();
        setToolCredits(data.credits || {});
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const handlePurchaseCustomCredits = async (tool: ToolDefinition, amount: number) => {
    // Different minimums for different tools
    if (tool.id === 'ai-image-detection') {
      if (amount < 5) {
        toast.error('Minimum purchase is 5 images ($1)');
        return;
      }
    } else if (tool.id === 'ai-video-detection') {
      if (amount < 2) {
        toast.error('Minimum purchase is 2 videos ($1)');
        return;
      }
    } else {
      if (amount < 10000) {
        toast.error('Minimum purchase is 10,000 characters ($1)');
        return;
      }
    }

    try {
      setIsLoading(prev => ({ ...prev, [tool.id]: true }));

      const response = await fetch('/api/credits/purchase-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolId: tool.id,
          toolName: tool.name,
          credits: amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await (await import('@stripe/stripe-js')).loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to start purchase');
    } finally {
      setIsLoading(prev => ({ ...prev, [tool.id]: false }));
    }
  };

  const handlePurchaseSuperSavingPlan = async () => {
    try {
      setIsLoading(prev => ({ ...prev, 'super-saving': true }));

      const response = await fetch('/api/credits/purchase-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'super_saving_plan',
          credits: 10000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await (await import('@stripe/stripe-js')).loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to start purchase');
    } finally {
      setIsLoading(prev => ({ ...prev, 'super-saving': false }));
    }
  };

  const formatCredits = (credits: number) => {
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(1)}M`;
    }
    if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toString();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-white/10 rounded w-1/3"></div>
              <div className="h-64 bg-white/10 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-white/10 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    window.location.href = '/';
    return null;
  }

  const purchasableTools = getPurchasableTools();
  const freeTools = getFreeTools();
  // Combine purchasable and free tools for credit purchase (all tools need credits)
  const allToolsForCredits = [...purchasableTools, ...freeTools];
  const toolsByCategory = allToolsForCredits.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolDefinition[]>);

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />

      <div className="lg:pl-64 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <Coins className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm font-medium text-white">Credit Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Purchase & Manage Credits
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Buy character credits for individual tools or get the Super Saving Plan for all tools at once.
            </p>
          </motion.div>

          {/* Super Saving Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-yellow-500/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-8 h-8 text-yellow-400" />
                    <h2 className="text-3xl font-bold text-white">Super Saving Plan</h2>
                    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/30">
                      BEST VALUE
                    </span>
                  </div>
                  <p className="text-gray-300 text-lg mb-4">
                    Get credits for EACH tool - {purchasableTools.length + freeTools.length} tools total:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-yellow-400 font-semibold mb-1">Most Tools ({purchasableTools.length + freeTools.length - 2} tools)</div>
                      <div className="text-white text-lg font-bold">10,000 characters</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-yellow-400 font-semibold mb-1">Image Detection</div>
                      <div className="text-white text-lg font-bold">5 images</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-yellow-400 font-semibold mb-1">Video Detection</div>
                      <div className="text-white text-lg font-bold">2 videos</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-white mb-2">$17</div>
                  <div className="text-sm text-gray-400">One-time purchase</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-2xl font-bold text-white">
                    {(() => {
                      const charTools = (purchasableTools.length + freeTools.length) - 2; // Exclude image/video
                      return formatCredits(10000 * charTools);
                    })()}
                  </div>
                  <div className="text-xs text-gray-400">Total Characters</div>
                  <div className="text-xs text-yellow-400 mt-1">(15 tools × 10K)</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-2xl font-bold text-white">5 + 2</div>
                  <div className="text-xs text-gray-400">Images + Videos</div>
                  <div className="text-xs text-yellow-400 mt-1">Image & Video tools</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-2xl font-bold text-white">{purchasableTools.length + freeTools.length}</div>
                  <div className="text-xs text-gray-400">Tools Included</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-2xl font-bold text-green-400">33%</div>
                  <div className="text-xs text-gray-400">Savings</div>
                </div>
              </div>

              <button
                onClick={handlePurchaseSuperSavingPlan}
                disabled={isLoading['super-saving']}
                className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading['super-saving'] ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Purchase Super Saving Plan</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Individual Tool Credits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Coins className="w-6 h-6" />
              Individual Tool Credits
            </h2>
            <p className="text-gray-400 mb-8">
              Purchase credits for specific tools. Pricing varies by tool type.
            </p>

            {Object.entries(toolsByCategory).map(([category, tools]) => (
              <div key={category} className="mb-12">
                <h3 className="text-xl font-bold text-white mb-4 capitalize flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {category.replace('-', ' ')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tools.map((tool, index) => {
                    const IconComponent = iconMap[tool.icon] || Package;
                    const credits = toolCredits[tool.id] || 0;

                    // Different defaults and pricing for different tools
                    let defaultAmount: number;
                    let price: number;
                    let unitLabel: string;
                    let pricingInfo: string;

                    if (tool.id === 'ai-image-detection') {
                      defaultAmount = customCreditAmount[tool.id] || 5;
                      price = Math.ceil(defaultAmount / 5); // $1 per 5 images
                      unitLabel = 'images';
                      pricingInfo = '$1 = 5 images';
                    } else if (tool.id === 'ai-video-detection') {
                      defaultAmount = customCreditAmount[tool.id] || 2;
                      price = Math.ceil(defaultAmount / 2); // $1 per 2 videos
                      unitLabel = 'videos';
                      pricingInfo = '$1 = 2 videos';
                    } else {
                      defaultAmount = customCreditAmount[tool.id] || 10000;
                      price = Math.ceil(defaultAmount / 10000); // $1 per 10,000 chars
                      unitLabel = 'characters';
                      pricingInfo = '$1 = 10,000 characters';
                    }

                    return (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 hover:border-white/20 transition-all"
                      >
                        {/* Tool Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-white">{tool.name}</h4>
                            <p className="text-xs text-gray-400">{tool.description}</p>
                          </div>
                        </div>

                        {/* Current Credits */}
                        <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Current Credits</span>
                            <span className="text-2xl font-bold text-white">
                              {tool.id === 'ai-image-detection' || tool.id === 'ai-video-detection'
                                ? credits.toLocaleString()
                                : formatCredits(credits)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{unitLabel}</div>
                        </div>

                        {/* Pricing Info */}
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <div className="text-xs text-yellow-400 font-medium">{pricingInfo}</div>
                        </div>

                        {/* Custom Credit Input */}
                        <div className="mb-4">
                          <label className="block text-sm text-gray-400 mb-2">
                            Purchase Amount (min: {tool.id === 'ai-image-detection' ? '5 images' : tool.id === 'ai-video-detection' ? '2 videos' : '10,000 chars'})
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={tool.id === 'ai-image-detection' ? 5 : tool.id === 'ai-video-detection' ? 2 : 10000}
                              step={tool.id === 'ai-image-detection' ? 5 : tool.id === 'ai-video-detection' ? 2 : 10000}
                              value={defaultAmount}
                              onChange={(e) => {
                                const min = tool.id === 'ai-image-detection' ? 5 : tool.id === 'ai-video-detection' ? 2 : 10000;
                                const step = tool.id === 'ai-image-detection' ? 5 : tool.id === 'ai-video-detection' ? 2 : 10000;
                                const value = Math.max(min, parseInt(e.target.value, 10) || min);
                                setCustomCreditAmount(prev => ({ ...prev, [tool.id]: value }));
                              }}
                              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                              placeholder={tool.id === 'ai-image-detection' ? '5' : tool.id === 'ai-video-detection' ? '2' : '10000'}
                            />
                            <div className="px-4 py-2 bg-white/10 rounded-lg text-white font-semibold min-w-[80px] flex items-center justify-center">
                              ${price}
                            </div>
                          </div>
                        </div>

                        {/* Purchase Button */}
                        <button
                          onClick={() => handlePurchaseCustomCredits(tool, defaultAmount)}
                          disabled={isLoading[tool.id]}
                          className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isLoading[tool.id] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              <span>Purchase Credits</span>
                            </>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

