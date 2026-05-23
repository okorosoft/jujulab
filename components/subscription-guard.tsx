"use client";

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  isUserSubscribed, 
  hasPremiumAccess, 
  hasEnterpriseAccess,
  hasSubscriptionPlan,
  getSubscriptionLimits
} from '@/lib/subscription-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, Zap } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiresPlan?: 'free' | 'pro' | 'enterprise';
  requiresActive?: boolean;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  requiresPlan = 'free',
  requiresActive = true,
  fallback,
  showUpgrade = true,
}) => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="animate-pulse bg-gray-200 rounded h-20"></div>;
  }

  // Check if user meets requirements
  const hasAccess = () => {
    if (requiresPlan === 'free') return true;
    if (requiresPlan === 'pro') return hasPremiumAccess(user);
    if (requiresPlan === 'enterprise') return hasEnterpriseAccess(user);
    return false;
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  // Show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgrade) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-lg">
            {requiresPlan === 'pro' ? 'Pro' : 'Enterprise'} Feature
          </CardTitle>
          <CardDescription>
            This feature requires a {requiresPlan} subscription to access.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link 
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined') {
                window.location.href = '/#pricing';
              }
            }}
          >
            <Button className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade to {requiresPlan === 'pro' ? 'Pro' : 'Enterprise'}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return null;
};

// Component to show subscription status
export const SubscriptionStatus: React.FC = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) return null;

  const isSubscribed = isUserSubscribed(user);
  const limits = getSubscriptionLimits(user);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isSubscribed ? "default" : "secondary"}>
        {isSubscribed ? (
          <>
            <Crown className="h-3 w-3 mr-1" />
            {hasEnterpriseAccess(user) ? 'Enterprise' : 'Pro'}
          </>
        ) : (
          <>
            <Lock className="h-3 w-3 mr-1" />
            Free
          </>
        )}
      </Badge>
      
      {!isSubscribed && (
        <span className="text-xs text-gray-500">
          Limited features
        </span>
      )}
    </div>
  );
};
