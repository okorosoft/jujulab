import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { getCurrentUsage, getUsageLimits, getUsageStats, canProcessWords } from '@/lib/usage-tracking';

export interface UsageData {
  total: number;
  humanizer: number;
  detector: number;
  currentMonth: number;
  lastReset: string;
}

export interface UsageLimits {
  remaining: number;
  total: number;
  isUnlimited: boolean;
  percentage: number;
}

export interface UsageTrackingReturn {
  usage: UsageData | null;
  limits: UsageLimits | null;
  isLoading: boolean;
  error: string | null;
  refreshUsage: () => Promise<void>;
  trackUsage: (wordCount: number, feature: 'humanizer' | 'detector') => Promise<{ success: boolean; error?: string }>;
  canProcess: (wordCount: number) => { allowed: boolean; reason?: string; upgradeRequired?: string };
  formatUsage: (count: number) => string;
  getStatusColor: (percentage: number) => string;
  getStatusText: (percentage: number) => string;
}

export const useUsageTracking = (): UsageTrackingReturn => {
  const { user, isLoaded } = useUser();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load usage data from user metadata
  const loadUsageData = useCallback(() => {
    if (!user || !isLoaded) return;

    try {
      const usageData = getCurrentUsage(user);
      const limitsData = getUsageLimits(user);
      const stats = getUsageStats(user);

      setUsage({
        total: stats.current,
        humanizer: stats.humanizer,
        detector: stats.detector,
        currentMonth: stats.currentMonth,
        lastReset: stats.lastReset
      });

      setLimits({
        remaining: stats.remaining,
        total: stats.total,
        isUnlimited: stats.isUnlimited,
        percentage: stats.percentage
      });

      setError(null);
    } catch (err) {
      console.error('Error loading usage data:', err);
      setError('Failed to load usage data');
    }
  }, [user, isLoaded]);

  // Load usage data when user changes
  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  // Refresh usage data from server
  const refreshUsage = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/track-usage');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch usage data`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }
      
      setUsage({
        total: data.usage.total,
        humanizer: data.usage.humanizer,
        detector: data.usage.detector,
        currentMonth: data.usage.currentMonth,
        lastReset: data.usage.lastReset
      });

      setLimits({
        remaining: data.limits.remaining,
        total: data.limits.total,
        isUnlimited: data.limits.isUnlimited,
        percentage: data.limits.percentage
      });
    } catch (err) {
      console.error('Error refreshing usage:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh usage data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Track usage
  const trackUsage = useCallback(async (wordCount: number, feature: 'humanizer' | 'detector') => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/track-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordCount,
          feature,
          action: 'add'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      // Update local state
      setUsage({
        total: data.usage.total,
        humanizer: data.usage.humanizer,
        detector: data.usage.detector,
        currentMonth: data.usage.currentMonth,
        lastReset: usage?.lastReset || new Date().toISOString().split('T')[0]
      });

      setLimits({
        remaining: data.limits.remaining,
        total: data.limits.total,
        isUnlimited: data.limits.isUnlimited,
        percentage: data.limits.percentage
      });

      return { success: true };
    } catch (err) {
      console.error('Error tracking usage:', err);
      return { success: false, error: 'Failed to track usage' };
    } finally {
      setIsLoading(false);
    }
  }, [user, usage?.lastReset]);

  // Check if user can process words
  const canProcess = useCallback((wordCount: number) => {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }
    return canProcessWords(user, wordCount);
  }, [user]);

  // Memoize formatting and status functions
  const formatUsage = useCallback((count: number) => {
    return count.toLocaleString();
  }, []);

  // Get status color for progress bars - memoized
  const getStatusColor = useCallback((percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  }, []);

  // Get status text - memoized
  const getStatusText = useCallback((percentage: number) => {
    if (percentage >= 100) return 'Limit reached';
    if (percentage >= 80) return 'Almost at limit';
    return 'Good usage';
  }, []);

  return {
    usage,
    limits,
    isLoading,
    error,
    refreshUsage,
    trackUsage,
    canProcess,
    formatUsage,
    getStatusColor,
    getStatusText
  };
};
