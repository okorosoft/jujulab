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
    const { toolId, toolName } = body;

    if (!toolId || !toolName) {
      return NextResponse.json(
        { error: 'Missing toolId or toolName' },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    // Check if tool is already purchased
    const purchasedTools = (user.publicMetadata?.purchasedTools as string[]) || [];
    if (purchasedTools.includes(toolId)) {
      return NextResponse.json(
        { error: 'Tool already purchased' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.publicMetadata?.stripeCustomerId as string | undefined;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0]?.emailAddress,
        metadata: {
          clerkUserId: userId,
        },
      });
      stripeCustomerId = customer.id;
      
      // Update user metadata with Stripe customer ID
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          stripeCustomerId,
        },
      });
    }

    // Create checkout session for $1 tool purchase
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${toolName} - Tool Purchase`,
              description: `Purchase ${toolName} tool for your collection`,
            },
            unit_amount: 100, // $1.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/market?success=true&toolId=${toolId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/market?canceled=true`,
      metadata: {
        type: 'tool_purchase',
        toolId,
        toolName,
        userId,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

