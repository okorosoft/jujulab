import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    // Extract subscription data from user metadata
    const subscriptionData = {
      planName: (user.publicMetadata?.planName as string) || 'free',
      subscriptionStatus: (user.publicMetadata?.subscriptionStatus as string) || 'active',
      cancelAtPeriodEnd: Boolean(user.publicMetadata?.cancelAtPeriodEnd) || false,
      currentPeriodEnd: user.publicMetadata?.currentPeriodEnd || null,
      stripeCustomerId: (user.publicMetadata?.stripeCustomerId as string) || null,
      subscriptionId: (user.publicMetadata?.subscriptionId as string) || null,
    };

    // Determine subscription status
    const isSubscribed = subscriptionData.planName !== 'free' && 
                        subscriptionData.subscriptionStatus === 'active' && 
                        !subscriptionData.cancelAtPeriodEnd;

    const isPremium = (subscriptionData.planName === 'pro' || subscriptionData.planName === 'enterprise') && 
                     subscriptionData.subscriptionStatus === 'active' &&
                     !subscriptionData.cancelAtPeriodEnd;

    const isEnterprise = subscriptionData.planName === 'enterprise' && 
                        subscriptionData.subscriptionStatus === 'active' &&
                        !subscriptionData.cancelAtPeriodEnd;

    // Get subscription limits
    const getSubscriptionLimits = (planName: string) => {
      switch (planName) {
        case 'pro':
          return {
            maxFileSize: 25, // MB
            hasAnalytics: true,
            hasExport: true,
            hasPrioritySupport: true,
            hasTeamCollaboration: false,
            hasAPI: false,
          };
        
        case 'enterprise':
          return {
            maxFileSize: -1, // Unlimited
            hasAnalytics: true,
            hasExport: true,
            hasPrioritySupport: true,
            hasTeamCollaboration: true,
            hasAPI: true,
          };
        
        default: // 'free'
          return {
            maxFileSize: 5, // MB
            hasAnalytics: false,
            hasExport: false,
            hasPrioritySupport: false,
            hasTeamCollaboration: false,
            hasAPI: false,
          };
      }
    };

    const limits = getSubscriptionLimits(subscriptionData.planName);

    return NextResponse.json({
      userId,
      subscription: subscriptionData,
      isSubscribed,
      isPremium,
      isEnterprise,
      limits,
      currentPeriodEnd: subscriptionData.currentPeriodEnd 
        ? new Date(Number(subscriptionData.currentPeriodEnd) * 1000).toISOString()
        : null,
    });

  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' }, 
      { status: 500 }
    );
  }
} 