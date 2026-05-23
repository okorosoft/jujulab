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
    const { toolId, type, sessionId } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Missing type' },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    // Get Stripe customer ID
    const stripeCustomerId = user.publicMetadata?.stripeCustomerId as string | undefined;
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      );
    }

    let verified = false;
    let verifiedSession: Stripe.Checkout.Session | undefined;

    // If sessionId is provided, check that specific session first
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const metadata = session.metadata;

        if (metadata &&
          (session.payment_status === 'paid' || session.status === 'complete')) {

          if (type === 'super_saving_plan' && metadata.type === 'super_saving_plan') {
            // Verify Super Saving Plan purchase
            verified = true;
            verifiedSession = session;
          } else if (type === 'credit_purchase' && metadata.type === 'credit_purchase' && metadata.toolId === toolId) {
            // Verify individual credit purchase
            verified = true;
            verifiedSession = session;
          }
        }
      } catch (error) {
        console.error('Error retrieving session:', error);
      }
    }

    // If no session found via sessionId, check recent sessions
    let sessions: Stripe.ApiList<Stripe.Checkout.Session> | undefined;
    if (!verified) {
      sessions = await stripe.checkout.sessions.list({
        customer: stripeCustomerId,
        limit: 20,
      });

      // Find a completed/paid session matching the type
      const matchingSession = sessions.data.find(session => {
        const metadata = session.metadata;
        if (!metadata) return false;

        if (type === 'super_saving_plan' && metadata.type === 'super_saving_plan') {
          return session.payment_status === 'paid' || session.status === 'complete';
        } else if (type === 'credit_purchase' && metadata.type === 'credit_purchase' && metadata.toolId === toolId) {
          return session.payment_status === 'paid' || session.status === 'complete';
        }
        return false;
      });

      if (matchingSession) {
        verified = true;
        verifiedSession = matchingSession;
      }
    }

    if (verified && verifiedSession) {
      // Update credits immediately based on type
      const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
      const sessionId = verifiedSession.id;
      const metadata = verifiedSession.metadata;

      if (type === 'super_saving_plan') {
        // Super Saving Plan: Credits per tool (varies by tool type)
        const allToolIds = [
          // Free tools (still need credits)
          'ai-humanize', 'ai-detector', 'word-counter', 'character-counter', 'ask-ai',
          // Purchasable tools
          'ai-image-detection', 'ai-video-detection', 'grammar-check', 'spell-check',
          'plagiarism-check', 'translator', 'html-to-text', 'text-to-html', 'pdf-to-html',
          'summarizer', 'ai-homework-helper', 'ai-math-solver',
          'code-translator', 'ai-lessons', 'ai-practice', 'ai-tutor'
        ];

        // Add credits to EACH tool individually based on tool type
        allToolIds.forEach(toolId => {
          if (toolId === 'ai-image-detection') {
            // $1 = 5 images, so give 5 images per tool
            toolCredits[toolId] = (toolCredits[toolId] || 0) + 5;
          } else if (toolId === 'ai-video-detection') {
            // $1 = 2 videos, so give 2 videos per tool
            toolCredits[toolId] = (toolCredits[toolId] || 0) + 2;
          } else {
            // Other tools: 10,000 characters
            toolCredits[toolId] = (toolCredits[toolId] || 0) + 10000;
          }
        });

        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: {
            ...user.publicMetadata,
            toolCredits,
          },
        });

        console.log(`✅ Super Saving Plan purchase verified and credits added for user ${userId} (Session: ${sessionId})`);
      } else if (type === 'credit_purchase' && toolId) {
        // Individual tool credit purchase
        let session: Stripe.Checkout.Session | undefined;

        if (sessionId) {
          try {
            session = await stripe.checkout.sessions.retrieve(sessionId);
          } catch (error) {
            console.error('Error retrieving session:', error);
          }
        }

        if (!session && sessions) {
          session = sessions.data.find(s =>
            s.metadata?.toolId === toolId &&
            (s.payment_status === 'paid' || s.status === 'complete')
          );
        }

        if (session?.metadata) {
          const credits = parseInt(session.metadata.credits || '10000', 10);
          toolCredits[toolId] = (toolCredits[toolId] || 0) + credits;

          await clerk.users.updateUserMetadata(userId, {
            publicMetadata: {
              ...user.publicMetadata,
              toolCredits,
            },
          });

          console.log(`✅ Credit purchase verified: ${credits} credits added to ${toolId} for user ${userId}`);
        }
      }

      return NextResponse.json({
        purchased: true,
        message: 'Credit purchase verified successfully'
      });
    }

    // If no completed session found, return not purchased yet
    return NextResponse.json({
      purchased: false,
      message: 'Purchase not yet confirmed'
    });
  } catch (error: any) {
    console.error('Error verifying credit purchase:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify purchase' },
      { status: 500 }
    );
  }
}

