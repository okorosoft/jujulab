import { getUserSubscription } from './stripe';

// Types for subscription checks
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

// Check if user has any paid subscription
export const isUserSubscribed = (user: any): boolean => {
  if (!user) return false;
  
  const subscription = getUserSubscription(user);
  return subscription.planName !== 'free' && 
         subscription.subscriptionStatus === 'active' && 
         !subscription.cancelAtPeriodEnd;
};

// Check if user has a specific plan
export const hasSubscriptionPlan = (user: any, planName: SubscriptionPlan): boolean => {
  if (!user) return planName === 'free';
  
  const subscription = getUserSubscription(user);
  return subscription.planName === planName && subscription.subscriptionStatus === 'active';
};

// Check if user has access to premium features
export const hasPremiumAccess = (user: any): boolean => {
  if (!user) return false;
  
  const subscription = getUserSubscription(user);
  return (subscription.planName === 'pro' || subscription.planName === 'enterprise') && 
         subscription.subscriptionStatus === 'active' &&
         !subscription.cancelAtPeriodEnd;
};

// Check if user has enterprise features
export const hasEnterpriseAccess = (user: any): boolean => {
  if (!user) return false;
  
  const subscription = getUserSubscription(user);
  return subscription.planName === 'enterprise' && 
         subscription.subscriptionStatus === 'active' &&
         !subscription.cancelAtPeriodEnd;
};

// Check if subscription is in grace period (canceled but still active)
export const isInGracePeriod = (user: any): boolean => {
  if (!user) return false;
  
  const subscription = getUserSubscription(user);
  return subscription.cancelAtPeriodEnd && 
         subscription.subscriptionStatus === 'active' &&
         subscription.currentPeriodEnd && 
         subscription.currentPeriodEnd > new Date();
};

// Get subscription limits based on plan
export const getSubscriptionLimits = (user: any) => {
  if (!user) {
    return {
      maxWordsPerMonth: 100,
      maxFileSize: 5, // MB
      hasAnalytics: false,
      hasExport: false,
      hasPrioritySupport: false,
      hasTeamCollaboration: false,
      hasAPI: false,
      hasTranslation: false,
      hasRehumanization: false,
      hasDocumentHistory: false,
      hasAdvancedDetection: false,
    };
  }

  const subscription = getUserSubscription(user);
  const planName = subscription.planName;

  switch (planName) {
    case 'pro':
      return {
        maxWordsPerMonth: 30000,
        maxFileSize: 25, // MB
        hasAnalytics: true,
        hasExport: true,
        hasPrioritySupport: true,
        hasTeamCollaboration: false,
        hasAPI: false,
        hasTranslation: true,
        hasRehumanization: true,
        hasDocumentHistory: true,
        hasAdvancedDetection: true,
      };
    
    case 'enterprise':
      return {
        maxWordsPerMonth: -1, // Unlimited
        maxFileSize: -1, // Unlimited
        hasAnalytics: true,
        hasExport: true,
        hasPrioritySupport: true,
        hasTeamCollaboration: true,
        hasAPI: true,
        hasTranslation: true,
        hasRehumanization: true,
        hasDocumentHistory: true,
        hasAdvancedDetection: true,
      };
    
    default: // 'free'
      return {
        maxWordsPerMonth: 100,
        maxFileSize: 5, // MB
        hasAnalytics: false,
        hasExport: false,
        hasPrioritySupport: false,
        hasTeamCollaboration: false,
        hasAPI: false,
        hasTranslation: false,
        hasRehumanization: false,
        hasDocumentHistory: false,
        hasAdvancedDetection: false,
      };
  }
};

// DEPRECATED: Use canProcessWords from usage-tracking.ts instead
// This function is kept for backwards compatibility but should not be used
export const canProcessWordsLegacy = (user: any, wordCount: number, currentUsage: number = 0): { allowed: boolean; reason?: string; upgradeRequired?: string } => {
  const limits = getSubscriptionLimits(user);
  
  // Unlimited plans
  if (limits.maxWordsPerMonth === -1) return { allowed: true };
  
  // Check if adding these words would exceed limit
  const totalUsage = currentUsage + wordCount;
  
  if (totalUsage > limits.maxWordsPerMonth) {
    const remaining = Math.max(0, limits.maxWordsPerMonth - currentUsage);
    return {
      allowed: false,
      reason: `You can only process ${remaining} more words this month. You're trying to process ${wordCount} words.`,
      upgradeRequired: limits.maxWordsPerMonth === 100 ? 'Pro' : 'Enterprise'
    };
  }
  
  return { allowed: true };
};

// Check if user can upload file of given size
export const canUploadFile = (user: any, fileSizeMB: number): { allowed: boolean; reason?: string; upgradeRequired?: string } => {
  const limits = getSubscriptionLimits(user);
  
  // Unlimited file size
  if (limits.maxFileSize === -1) return { allowed: true };
  
  if (fileSizeMB > limits.maxFileSize) {
    return {
      allowed: false,
      reason: `File size (${fileSizeMB}MB) exceeds your plan limit of ${limits.maxFileSize}MB`,
      upgradeRequired: limits.maxFileSize === 5 ? 'Pro' : 'Enterprise'
    };
  }
  
  return { allowed: true };
};

// Check if user can access a specific feature
export const canAccessFeature = (user: any, feature: string): { allowed: boolean; reason?: string; upgradeRequired?: string } => {
  const limits = getSubscriptionLimits(user);
  
  switch (feature) {
    case 'translation':
      if (!limits.hasTranslation) {
        return {
          allowed: false,
          reason: 'Translation feature requires Pro plan or higher',
          upgradeRequired: 'Pro'
        };
      }
      break;
      
    case 'rehumanization':
      if (!limits.hasRehumanization) {
        return {
          allowed: false,
          reason: 'Rehumanization feature requires Pro plan or higher',
          upgradeRequired: 'Pro'
        };
      }
      break;
      
    case 'documentHistory':
      if (!limits.hasDocumentHistory) {
        return {
          allowed: false,
          reason: 'Document history requires Pro plan or higher',
          upgradeRequired: 'Pro'
        };
      }
      break;
      
    case 'advancedDetection':
      if (!limits.hasAdvancedDetection) {
        return {
          allowed: false,
          reason: 'Advanced AI detection requires Pro plan or higher',
          upgradeRequired: 'Pro'
        };
      }
      break;
      
    case 'export':
      if (!limits.hasExport) {
        return {
          allowed: false,
          reason: 'Export feature requires Pro plan or higher',
          upgradeRequired: 'Pro'
        };
      }
      break;
      
    case 'analytics':
      if (!limits.hasAnalytics) {
        return {
          allowed: false,
          reason: 'Analytics dashboard requires Pro plan or higher',
          upgradeRequired: 'Pro'
        };
      }
      break;
      
    case 'teamCollaboration':
      if (!limits.hasTeamCollaboration) {
        return {
          allowed: false,
          reason: 'Team collaboration requires Enterprise plan',
          upgradeRequired: 'Enterprise'
        };
      }
      break;
      
    case 'apiAccess':
      if (!limits.hasAPI) {
        return {
          allowed: false,
          reason: 'API access requires Enterprise plan',
          upgradeRequired: 'Enterprise'
        };
      }
      break;
      
    default:
      return { allowed: true };
  }
  
  return { allowed: true };
};

// Get user's current usage and remaining quota
export const getUserUsage = (user: any): { used: number; remaining: number; total: number; isUnlimited: boolean } => {
  const limits = getSubscriptionLimits(user);
  // Use totalWords instead of monthlyWordUsage for consistency
  const used = (user?.publicMetadata?.totalWords as number) || 0;
  
  if (limits.maxWordsPerMonth === -1) {
    return {
      used: used,
      remaining: -1,
      total: -1,
      isUnlimited: true
    };
  }
  
  return {
    used: used,
    remaining: Math.max(0, limits.maxWordsPerMonth - used),
    total: limits.maxWordsPerMonth,
    isUnlimited: false
  };
};

// Get human-readable subscription status
export const getSubscriptionStatusText = (user: any): string => {
  if (!user) return 'Free Plan';
  
  const subscription = getUserSubscription(user);
  
  if (subscription.planName === 'free') {
    return 'Free Plan';
  }
  
  if (subscription.cancelAtPeriodEnd) {
    return `${subscription.planName.charAt(0).toUpperCase() + subscription.planName.slice(1)} (Canceling)`;
  }
  
  switch (subscription.subscriptionStatus) {
    case 'active':
      return `${subscription.planName.charAt(0).toUpperCase() + subscription.planName.slice(1)} Plan`;
    case 'past_due':
      return `${subscription.planName.charAt(0).toUpperCase() + subscription.planName.slice(1)} (Payment Due)`;
    case 'trialing':
      return `${subscription.planName.charAt(0).toUpperCase() + subscription.planName.slice(1)} (Trial)`;
    default:
      return `${subscription.planName.charAt(0).toUpperCase() + subscription.planName.slice(1)} (${subscription.subscriptionStatus})`;
  }
}; 