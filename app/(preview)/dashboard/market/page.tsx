"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import { 
  ShoppingCart,
  Check,
  X,
  Loader2,
  Package,
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
  Calculator
} from "lucide-react";
import { toast } from 'sonner';
import { ALL_TOOLS, getPurchasableTools, getFreeTools, ToolDefinition } from '@/lib/tool-definitions';

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
};

interface ToolStatus {
  purchased: boolean;
  activated: boolean;
}

export default function MarketPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [toolStatuses, setToolStatuses] = useState<Record<string, ToolStatus>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isActivating, setIsActivating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isSignedIn && user) {
      loadToolStatuses();
      
      // Check for success/cancel parameters
      const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
          const toolId = params.get('toolId');
          const sessionId = params.get('session_id');
          
          if (toolId) {
            toast.success('Verifying purchase...');
            
            // Immediately verify and update purchase status
            const verifyPurchase = async () => {
              try {
                const response = await fetch('/api/tools/verify-purchase', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ toolId, sessionId }),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.purchased) {
                    // Reload tool statuses
                    await loadToolStatuses();
                    toast.success('Tool purchased successfully! You can now activate it.');
                    // Dispatch event to update sidebar
                    window.dispatchEvent(new CustomEvent('toolPurchased', { detail: { toolId } }));
                    // Clean URL
                    window.history.replaceState({}, '', '/dashboard/market');
                  } else {
                    // Retry after a short delay (Stripe might still be processing)
                    setTimeout(async () => {
                      const retryResponse = await fetch('/api/tools/verify-purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toolId, sessionId }),
                      });
                      if (retryResponse.ok) {
                        const retryData = await retryResponse.json();
                        if (retryData.purchased) {
                          await loadToolStatuses();
                          toast.success('Tool purchased successfully! You can now activate it.');
                          // Dispatch event to update sidebar
                          window.dispatchEvent(new CustomEvent('toolPurchased', { detail: { toolId } }));
                        } else {
                          toast.warning('Purchase is processing. Please refresh if status doesn\'t update.');
                        }
                      }
                      // Clean URL after retry
                      window.history.replaceState({}, '', '/dashboard/market');
                    }, 2000);
                  }
                } else {
                  toast.warning('Purchase verification failed. Please refresh the page.');
                  window.history.replaceState({}, '', '/dashboard/market');
                }
              } catch (error) {
                console.error('Error verifying purchase:', error);
                toast.warning('Purchase verification failed. Please refresh the page.');
                window.history.replaceState({}, '', '/dashboard/market');
              }
            };
            
            verifyPurchase();
          } else {
            // Clean URL if no toolId
            window.history.replaceState({}, '', '/dashboard/market');
          }
      } else if (params.get('canceled') === 'true') {
        toast.info('Purchase canceled');
        window.history.replaceState({}, '', '/dashboard/market');
      }
    }
  }, [isSignedIn, user]);

  const loadToolStatuses = async () => {
    try {
      const response = await fetch('/api/tools/status');
      if (response.ok) {
        const data = await response.json();
        setToolStatuses(data.tools || {});
      }
    } catch (error) {
      console.error('Error loading tool statuses:', error);
    }
  };

  const handlePurchaseTool = async (tool: ToolDefinition) => {
    // Don't allow purchasing free tools
    if (tool.isFree) {
      toast.info('This tool is free! You can activate it directly.');
      return;
    }
    
    try {
      setIsLoading(prev => ({ ...prev, [tool.id]: true }));
      
      const response = await fetch('/api/tools/purchase-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolId: tool.id,
          toolName: tool.name,
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

  const handleActivateTool = async (toolId: string) => {
    try {
      setIsActivating(prev => ({ ...prev, [toolId]: true }));
      
      const response = await fetch('/api/tools/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate tool');
      }

      await loadToolStatuses();
      toast.success('Tool activated successfully');
      // Dispatch event to update sidebar
      window.dispatchEvent(new CustomEvent('toolActivated', { detail: { toolId } }));
    } catch (error: any) {
      console.error('Activation error:', error);
      toast.error(error.message || 'Failed to activate tool');
    } finally {
      setIsActivating(prev => ({ ...prev, [toolId]: false }));
    }
  };

  const handleDeactivateTool = async (toolId: string) => {
    try {
      setIsActivating(prev => ({ ...prev, [toolId]: true }));
      
      const response = await fetch('/api/tools/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deactivate tool');
      }

      await loadToolStatuses();
      toast.success('Tool deactivated successfully');
      // Dispatch event to update sidebar
      window.dispatchEvent(new CustomEvent('toolDeactivated', { detail: { toolId } }));
    } catch (error: any) {
      console.error('Deactivation error:', error);
      toast.error(error.message || 'Failed to deactivate tool');
    } finally {
      setIsActivating(prev => ({ ...prev, [toolId]: false }));
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 animate-pulse">
                  <div className="w-12 h-12 bg-white/10 rounded-xl mb-4"></div>
                  <div className="w-32 h-6 bg-white/10 rounded mb-2"></div>
                  <div className="w-full h-4 bg-white/10 rounded mb-4"></div>
                  <div className="w-full h-10 bg-white/10 rounded"></div>
                </div>
              ))}
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
  
  // Combine free tools and purchasable tools, but show free tools separately
  const allToolsForMarket = [...freeTools, ...purchasableTools];
  const toolsByCategory = allToolsForMarket.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolDefinition[]>);

  const getToolStatus = (toolId: string): ToolStatus => {
    // Free tools are always activated by default
    const freeToolIds = ['ai-humanize', 'ai-detector', 'word-counter', 'character-counter', 'ask-ai'];
    const isFreeTool = freeToolIds.includes(toolId);
    
    if (isFreeTool) {
      return { purchased: true, activated: true };
    }
    
    return toolStatuses[toolId] || { purchased: false, activated: false };
  };

  const getButtonText = (tool: ToolDefinition) => {
    if (tool.isFree) {
      const status = getToolStatus(tool.id);
      if (status.activated) return 'Deactivate';
      return 'Activate';
    }
    const status = getToolStatus(tool.id);
    if (status.activated) return 'Deactivate';
    if (status.purchased) return 'Activate';
    return 'Add to Collection';
  };

  const handleButtonClick = (tool: ToolDefinition) => {
    // Free tools don't need purchase, just activation
    if (tool.isFree) {
      const status = getToolStatus(tool.id);
      if (status.activated) {
        handleDeactivateTool(tool.id);
      } else {
        handleActivateTool(tool.id);
      }
      return;
    }
    
    const status = getToolStatus(tool.id);
    if (status.activated) {
      handleDeactivateTool(tool.id);
    } else if (status.purchased) {
      handleActivateTool(tool.id);
    } else {
      handlePurchaseTool(tool);
    }
  };

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
              <ShoppingCart className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm font-medium text-white">AI Tools Marketplace</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover & Purchase AI Tools
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Unlock powerful AI tools for just $1 each. Purchase tools and activate them in your sidebar.
            </p>
          </motion.div>

          {/* Tools by Category */}
          {Object.entries(toolsByCategory).map(([category, tools]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-white mb-6 capitalize flex items-center gap-2">
                <Package className="w-6 h-6" />
                {category.replace('-', ' ')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tools.map((tool, index) => {
                  const status = getToolStatus(tool.id);
                  const IconComponent = iconMap[tool.icon] || Package;
                  const isButtonLoading = isLoading[tool.id] || isActivating[tool.id];
                  
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className={`bg-white/5 backdrop-blur-xl rounded-xl p-4 shadow-lg border transition-all duration-300 ${
                        status.activated
                          ? 'border-green-500/50 shadow-2xl ring-2 ring-green-500/20'
                          : status.purchased
                          ? 'border-blue-500/50 shadow-xl'
                          : 'border-white/10 hover:border-white/20 hover:shadow-xl'
                      }`}
                    >
                      {/* Badges */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-1.5">
                          {tool.isFree && (
                            <div className="bg-gradient-to-r from-blue-500/90 to-cyan-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs font-semibold shadow-md border border-blue-400/50">
                              FREE
                            </div>
                          )}
                        </div>
                        {status.activated && (
                          <div className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs font-semibold shadow-md border border-green-400/50">
                            ✓ Active
                          </div>
                        )}
                      </div>

                      {/* Tool Icon */}
                      <div className="flex justify-center mb-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md backdrop-blur-sm border ${
                          status.activated
                            ? 'bg-green-500/20 border-green-500/30'
                            : status.purchased
                            ? 'bg-blue-500/20 border-blue-500/30'
                            : 'bg-white/10 border-white/20'
                        }`}>
                          <IconComponent className={`w-6 h-6 ${
                            status.activated
                              ? 'text-green-400'
                              : status.purchased
                              ? 'text-blue-400'
                              : 'text-white'
                          }`} />
                        </div>
                      </div>

                      {/* Tool Info */}
                      <h3 className="text-base font-bold text-white mb-1.5 text-center line-clamp-1">{tool.name}</h3>
                      <p className="text-gray-400 text-xs mb-3 text-center min-h-[32px] line-clamp-2">{tool.description}</p>

                      {/* Price */}
                      <div className="text-center mb-4">
                        {tool.isFree ? (
                          <>
                            <div className="text-xl font-bold text-green-400">FREE</div>
                            <div className="text-xs text-gray-400 mt-0.5">Credits required</div>
                          </>
                        ) : (
                          <>
                            <div className="text-xl font-bold text-white">${tool.price}</div>
                            <div className="text-xs text-gray-400">One-time</div>
                          </>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleButtonClick(tool)}
                        disabled={isButtonLoading}
                        className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                          tool.isFree
                            ? status.activated
                              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                              : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                            : status.activated
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                            : status.purchased
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                            : 'bg-white hover:bg-gray-100 text-black shadow-lg hover:shadow-xl'
                        } disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                      >
                        {isButtonLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            {status.activated ? (
                              <>
                                <X className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{getButtonText(tool)}</span>
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

