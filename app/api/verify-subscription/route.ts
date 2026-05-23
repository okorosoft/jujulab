import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    const subscription = {
      planName: (user.publicMetadata?.planName as string) || 'free',
      subscriptionStatus: (user.publicMetadata?.subscriptionStatus as string) || 'active',
      cancelAtPeriodEnd: Boolean(user.publicMetadata?.cancelAtPeriodEnd) || false,
      currentPeriodEnd: user.publicMetadata?.currentPeriodEnd 
        ? new Date(Number(user.publicMetadata.currentPeriodEnd) * 1000)
        : null,
      stripeCustomerId: (user.publicMetadata?.stripeCustomerId as string) || null,
      subscriptionId: (user.publicMetadata?.subscriptionId as string) || null,
    };

    return NextResponse.json({ 
      success: true, 
      subscription,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return NextResponse.json(
      { error: 'Failed to verify subscription' }, 
      { status: 500 }
    );
  }
}

