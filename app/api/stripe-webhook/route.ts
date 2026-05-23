import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  console.log('=== WEBHOOK EVENT RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    console.log('Request headers:', {
      'stripe-signature': signature ? 'Present' : 'Missing',
      'content-type': headersList.get('content-type'),
      'user-agent': headersList.get('user-agent')
    });

    if (!signature) {
      console.error('❌ No signature found in webhook request');
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified successfully');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('📋 Event Details:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🔄 Processing: checkout.session.completed');
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('📝 Handling checkout completion for:', session.id);

  try {
    const metadata = session.metadata;

    if (!metadata) {
      console.log('⚠️ No metadata found in checkout session');
      return;
    }

    const purchaseType = metadata.type;
    const clerkUserId = metadata.userId;

    if (!clerkUserId) {
      console.error('❌ No Clerk user ID found in checkout metadata');
      return;
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(clerkUserId);

    if (purchaseType === 'tool_purchase') {
      const toolId = metadata.toolId;
      const toolName = metadata.toolName;

      if (!toolId) {
        console.error('❌ No toolId found in checkout metadata');
        return;
      }

      // Get purchased tools
      const purchasedTools = (user.publicMetadata?.purchasedTools as string[]) || [];

      // Add tool to purchased list if not already there
      if (!purchasedTools.includes(toolId)) {
        purchasedTools.push(toolId);

        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            ...user.publicMetadata,
            purchasedTools,
          },
        });

        console.log(`✅ Successfully added tool ${toolId} (${toolName}) to user ${clerkUserId}'s purchased tools`);
      } else {
        console.log(`⚠️ Tool ${toolId} already in purchased tools for user ${clerkUserId}`);
      }
    } else if (purchaseType === 'credit_purchase') {
      // Handle credit purchase (we'll implement this next)
      const toolId = metadata.toolId;
      const credits = parseInt(metadata.credits || '0', 10);

      if (toolId && credits > 0) {
        // Get current credits
        const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
        toolCredits[toolId] = (toolCredits[toolId] || 0) + credits;

        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            ...user.publicMetadata,
            toolCredits,
          },
        });

        console.log(`✅ Successfully added ${credits} credits for tool ${toolId} to user ${clerkUserId}`);
      }
    } else if (purchaseType === 'super_saving_plan') {
      // Handle Super Saving Plan purchase
      // Super Saving Plan: Credits PER tool (not shared)
      // Includes both free and purchasable tools
      // For image/video detection: different credit amounts
      const creditsPerTool = parseInt(metadata.credits || '10000', 10);
      const allToolIds = [
        // Free tools (still need credits)
        'ai-humanize', 'ai-detector', 'word-counter', 'character-counter', 'ask-ai',
        // Purchasable tools
        'ai-image-detection', 'ai-video-detection', 'grammar-check', 'spell-check',
        'plagiarism-check', 'translator', 'html-to-text', 'text-to-html', 'pdf-to-html',
        'summarizer', 'ai-homework-helper', 'ai-math-solver',
        'code-translator', 'ai-lessons', 'ai-practice', 'ai-tutor'
      ];

      // Get current credits
      const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};

      // Add credits to EACH tool individually
      // For image detection: 50 images ($1 worth = 5 images, but Super Saving gives $1 per tool = 5 images)
      // For video detection: 20 videos ($1 worth = 2 videos, but Super Saving gives $1 per tool = 2 videos)
      // For other tools: 10,000 characters
      allToolIds.forEach(toolId => {
        if (toolId === 'ai-image-detection') {
          // $1 = 5 images, so give 5 images per tool
          toolCredits[toolId] = (toolCredits[toolId] || 0) + 5;
        } else if (toolId === 'ai-video-detection') {
          // $1 = 2 videos, so give 2 videos per tool
          toolCredits[toolId] = (toolCredits[toolId] || 0) + 2;
        } else {
          // Other tools: 10,000 characters
          toolCredits[toolId] = (toolCredits[toolId] || 0) + creditsPerTool;
        }
      });

      await clerk.users.updateUserMetadata(clerkUserId, {
        publicMetadata: {
          ...user.publicMetadata,
          toolCredits,
        },
      });

      const totalCredits = creditsPerTool * allToolIds.length;
      console.log(`✅ Successfully added ${creditsPerTool.toLocaleString()} credits to each of ${allToolIds.length} tools (${totalCredits.toLocaleString()} total) for user ${clerkUserId} (Super Saving Plan)`);
    }
  } catch (error) {
    console.error('❌ Error handling checkout completion:', error);
  }
}