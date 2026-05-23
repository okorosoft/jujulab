import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { toolId, sessionId } = body;

    if (!toolId) {
      return NextResponse.json(
        { error: 'Missing toolId' },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    // Check if tool is already purchased
    const purchasedTools = (user.publicMetadata?.purchasedTools as string[]) || [];
    if (purchasedTools.includes(toolId)) {
      return NextResponse.json({ 
        purchased: true,
        message: 'Tool already purchased' 
      });
    }

    // Get Stripe customer ID
    const stripeCustomerId = user.publicMetadata?.stripeCustomerId as string | undefined;
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      );
    }

    let toolSession: Stripe.Checkout.Session | undefined;

    // If sessionId is provided, check that specific session first
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.metadata?.toolId === toolId && 
            (session.payment_status === 'paid' || session.status === 'complete')) {
          toolSession = session;
        }
      } catch (error) {
        console.error('Error retrieving session:', error);
      }
    }

    // If no session found via sessionId, check recent sessions
    if (!toolSession) {
      const sessions = await stripe.checkout.sessions.list({
        customer: stripeCustomerId,
        limit: 20, // Check more sessions to catch recent ones
      });

      // Find a completed/paid session for this tool
      toolSession = sessions.data.find(session => 
        session.metadata?.toolId === toolId && 
        (session.payment_status === 'paid' || session.status === 'complete')
      );
    }

    if (toolSession) {
      // Tool purchase verified - update user metadata immediately
      const updatedPurchasedTools = [...purchasedTools, toolId];
      
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          purchasedTools: updatedPurchasedTools,
        },
      });

      console.log(`✅ Tool ${toolId} purchase verified and added for user ${userId}`);
      
      return NextResponse.json({ 
        purchased: true,
        message: 'Tool purchase verified successfully' 
      });
    }

    // If no completed session found, return not purchased yet
    return NextResponse.json({ 
      purchased: false,
      message: 'Purchase not yet confirmed' 
    });
  } catch (error: any) {
    console.error('Error verifying purchase:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify purchase' },
      { status: 500 }
    );
  }
}

