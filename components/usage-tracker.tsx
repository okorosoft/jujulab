"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUsageTracking } from '@/lib/hooks/useUsageTracking';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UsageTrackerProps {
  feature: 'humanizer' | 'detector';
  wordCount: number;
  onUsageTracked?: (success: boolean) => void;
  showToast?: boolean;
}

export default function UsageTracker({ 
  feature, 
  wordCount, 
  onUsageTracked, 
  showToast = true 
}: UsageTrackerProps) {
  const { trackUsage, canProcess, limits, usage, isLoading } = useUsageTracking();
  const [isTracking, setIsTracking] = useState(false);

  // Check if user can process the words
  const canProcessResult = canProcess(wordCount);

  const handleTrackUsage = useCallback(async () => {
    if (wordCount <= 0) return;

    setIsTracking(true);
    try {
      const result = await trackUsage(wordCount, feature);
      
      if (result.success) {
        if (showToast) {
          toast.success(`Usage tracked: ${wordCount.toLocaleString()} words processed`);
        }
        onUsageTracked?.(true);
      } else {
        if (showToast) {
          toast.error(result.error || 'Failed to track usage');
        }
        onUsageTracked?.(false);
      }
    } catch (error) {
      // Error logging for development/debugging only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error tracking usage:', error);
      }
      if (showToast) {
        toast.error('Failed to track usage');
      }
      onUsageTracked?.(false);
    } finally {
      setIsTracking(false);
    }
  }, [wordCount, feature, trackUsage, showToast, onUsageTracked]);

  // Track usage when wordCount changes (only if not already tracked)
  useEffect(() => {
    if (wordCount > 0 && canProcessResult.allowed && !isTracking) {
      handleTrackUsage();
    } else if (wordCount > 0 && !canProcessResult.allowed) {
      if (showToast) {
        toast.error(canProcessResult.reason || 'Usage limit exceeded');
      }
      onUsageTracked?.(false);
    }
  }, [wordCount, canProcessResult.allowed, isTracking, canProcessResult.reason, handleTrackUsage, showToast, onUsageTracked]);

  if (isLoading || isTracking) {
    return (
      <div className="flex items-center space-x-2 text-sm text-slate-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Tracking usage...</span>
      </div>
    );
  }

  if (!canProcessResult.allowed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
      >
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">Usage Limit Exceeded</p>
          <p className="text-xs text-red-600">{canProcessResult.reason}</p>
        </div>
      </motion.div>
    );
  }

  if (limits && limits.percentage > 80) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
      >
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">Approaching Limit</p>
          <p className="text-xs text-yellow-600">
            You&apos;ve used {limits.percentage.toFixed(1)}% of your monthly allowance
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
    >
      <CheckCircle className="w-4 h-4 text-green-600" />
      <div className="flex-1">
        <p className="text-sm font-medium text-green-800">Usage Tracked</p>
        <p className="text-xs text-green-600">
          {wordCount.toLocaleString()} words processed for {feature}
        </p>
      </div>
    </motion.div>
  );
}

// Usage display component
export function UsageDisplay() {
  const { usage, limits, formatUsage, getStatusColor, getStatusText, refreshUsage } = useUsageTracking();

  if (!usage || !limits) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Usage summary */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Monthly Usage</span>
        <span className="text-sm text-slate-600">
          {formatUsage(usage.total)} / {limits.isUnlimited ? '∞' : formatUsage(limits.total)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            limits.isUnlimited
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
              : getStatusColor(limits.percentage)
          }`}
          style={{ 
            width: limits.isUnlimited 
              ? '100%' 
              : `${Math.min(limits.percentage, 100)}%` 
          }}
        />
      </div>

      {/* Usage breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-600">Humanizer:</span>
          <span className="font-medium">{formatUsage(usage.humanizer)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Detector:</span>
          <span className="font-medium">{formatUsage(usage.detector)}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${
          limits.percentage >= 100 ? 'text-red-600' : 
          limits.percentage >= 80 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {getStatusText(limits.percentage)}
        </span>
        <button
          onClick={refreshUsage}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1"
        >
          <Activity className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
