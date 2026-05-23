import { getUserSubscription } from './stripe';
import { getSubscriptionLimits } from './subscription-utils';

export interface UsageData {
  totalWords: number;
  humanizerWords: number;
  detectorWords: number;
  lastResetDate: string; // ISO date string
  monthlyUsage: { [month: string]: number }; // Format: "2024-01": 1500
}

export interface UsageLimits {
  maxWordsPerMonth: number;
  isUnlimited: boolean;
  remainingWords: number;
  usagePercentage: number;
}

/**
 * Get current usage data from user metadata
 */
export const getCurrentUsage = (user: any): UsageData => {
  if (!user?.publicMetadata) {
    return {
      totalWords: 0,
      humanizerWords: 0,
      detectorWords: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      monthlyUsage: {}
    };
  }

  const metadata = user.publicMetadata;
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format

  return {
    totalWords: (metadata.totalWords as number) || 0,
    humanizerWords: (metadata.humanizerWords as number) || 0,
    detectorWords: (metadata.detectorWords as number) || 0,
    lastResetDate: (metadata.lastResetDate as string) || new Date().toISOString().split('T')[0],
    monthlyUsage: (metadata.monthlyUsage as { [month: string]: number }) || {}
  };
};

/**
 * Get usage limits based on user's subscription
 */
export const getUsageLimits = (user: any): UsageLimits => {
  const subscription = getUserSubscription(user);
  const limits = getSubscriptionLimits(user);
  const usage = getCurrentUsage(user);
  
  const maxWords = limits.maxWordsPerMonth;
  const isUnlimited = maxWords === -1;
  const remainingWords = isUnlimited ? -1 : Math.max(0, maxWords - usage.totalWords);
  const usagePercentage = isUnlimited ? 0 : (usage.totalWords / maxWords) * 100;

  return {
    maxWordsPerMonth: maxWords,
    isUnlimited,
    remainingWords,
    usagePercentage: Math.min(usagePercentage, 100)
  };
};

/**
 * Check if user can process the requested word count
 */
export const canProcessWords = (user: any, wordCount: number): { allowed: boolean; reason?: string; upgradeRequired?: string } => {
  const limits = getUsageLimits(user);
  
  if (limits.isUnlimited) {
    return { allowed: true };
  }

  const usage = getCurrentUsage(user);
  const totalAfterProcessing = usage.totalWords + wordCount;

  if (totalAfterProcessing > limits.maxWordsPerMonth) {
    const subscription = getUserSubscription(user);
    const upgradeRequired = subscription.planName === 'free' ? 'Pro' : 'Enterprise';
    
    const remaining = Math.max(0, limits.maxWordsPerMonth - usage.totalWords);
    return {
      allowed: false,
      reason: `You can only process ${remaining} more words this month. You're trying to process ${wordCount} words.`,
      upgradeRequired
    };
  }

  return { allowed: true };
};

/**
 * Get current month usage
 */
export const getCurrentMonthUsage = (user: any): number => {
  const usage = getCurrentUsage(user);
  const currentMonth = new Date().toISOString().substring(0, 7);
  return usage.monthlyUsage[currentMonth] || 0;
};

/**
 * Check if usage should be reset (new month)
 */
export const shouldResetUsage = (user: any): boolean => {
  const usage = getCurrentUsage(user);
  const lastReset = new Date(usage.lastResetDate);
  const now = new Date();
  
  // Reset if it's a new month
  return lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
};

/**
 * Get usage statistics for display
 */
export const getUsageStats = (user: any) => {
  const usage = getCurrentUsage(user);
  const limits = getUsageLimits(user);
  const currentMonthUsage = getCurrentMonthUsage(user);
  
  return {
    current: usage.totalWords,
    currentMonth: currentMonthUsage,
    humanizer: usage.humanizerWords,
    detector: usage.detectorWords,
    remaining: limits.remainingWords,
    total: limits.maxWordsPerMonth,
    isUnlimited: limits.isUnlimited,
    percentage: limits.usagePercentage,
    lastReset: usage.lastResetDate
  };
};

/**
 * Format usage for display
 */
export const formatUsage = (count: number, isUnlimited: boolean = false): string => {
  if (isUnlimited) return '∞';
  return count.toLocaleString();
};

/**
 * Get usage status color for progress bars
 */
export const getUsageStatusColor = (percentage: number): string => {
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 80) return 'bg-yellow-500';
  return 'bg-green-500';
};

/**
 * Get usage status text
 */
export const getUsageStatusText = (percentage: number): string => {
  if (percentage >= 100) return 'Limit reached';
  if (percentage >= 80) return 'Almost at limit';
  return 'Good usage';
};
