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
    const { type, toolId, toolName, credits } = body;

    // Different minimums for different tool types
    if (type !== 'super_saving_plan') {
      if (toolId === 'ai-image-detection') {
        if (!credits || credits < 5) {
          return NextResponse.json(
            { error: 'Minimum purchase is 5 images ($1)' },
            { status: 400 }
          );
        }
      } else if (toolId === 'ai-video-detection') {
        if (!credits || credits < 2) {
          return NextResponse.json(
            { error: 'Minimum purchase is 2 videos ($1)' },
            { status: 400 }
          );
        }
      } else {
        if (!credits || credits < 10000) {
          return NextResponse.json(
            { error: 'Minimum purchase is 10,000 characters ($1)' },
            { status: 400 }
          );
        }
      }
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

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

      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          stripeCustomerId,
        },
      });
    }

    let session: Stripe.Checkout.Session;

    if (type === 'super_saving_plan') {
      // Super Saving Plan: $17 for 10,000 chars PER tool (for all tools, including free ones)
      const allToolIds = [
        // Free tools (still need credits)
        'ai-humanize', 'ai-detector', 'word-counter', 'character-counter', 'ask-ai',
        // Purchasable tools
        'ai-image-detection', 'ai-video-detection', 'grammar-check', 'spell-check',
        'plagiarism-check', 'translator', 'html-to-text', 'text-to-html', 'pdf-to-html',
        'summarizer', 'ai-homework-helper', 'ai-math-solver',
        'code-translator', 'ai-lessons', 'ai-practice', 'ai-tutor'
      ];

      session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Super Saving Plan',
                description: `Credits for EACH tool: 10K characters (${allToolIds.length - 2} tools), 5 images (Image Detection), 2 videos (Video Detection) - ${allToolIds.length} tools total`,
              },
              unit_amount: 1700, // $17.00 in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/credits?success=true&type=super_saving_plan&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/credits?canceled=true`,
        metadata: {
          type: 'super_saving_plan',
          credits: credits.toString(), // 10,000 per tool
          userId,
        },
      });
    } else {
      // Individual tool credit purchase
      if (!toolId || !toolName) {
        return NextResponse.json(
          { error: 'Missing toolId or toolName' },
          { status: 400 }
        );
      }

      // Special pricing for image and video detection
      let price: number;
      let description: string;

      if (toolId === 'ai-image-detection') {
        // $1 per 5 images
        const images = credits; // credits represents number of images
        price = Math.ceil(images / 5); // $1 per 5 images
        description = `${images} images for ${toolName}`;
      } else if (toolId === 'ai-video-detection') {
        // $1 per 2 videos
        const videos = credits; // credits represents number of videos
        price = Math.ceil(videos / 2); // $1 per 2 videos
        description = `${videos} videos for ${toolName}`;
      } else {
        // Default: $1 per 10,000 characters
        price = Math.ceil(credits / 10000);
        description = `${credits.toLocaleString()} characters for ${toolName}`;
      }

      session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${toolName} - Credits`,
                description,
              },
              unit_amount: price * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/credits?success=true&toolId=${toolId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/credits?canceled=true`,
        metadata: {
          type: 'credit_purchase',
          toolId,
          toolName,
          credits: credits.toString(),
          userId,
        },
      });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

