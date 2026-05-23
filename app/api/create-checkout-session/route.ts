import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, planName } = await req.json();

    if (!priceId || !planName) {
      return NextResponse.json(
        { error: 'Price ID and plan name are required' }, 
        { status: 400 }
      );
    }

    // Get user info from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    // Create or get Stripe customer
    let customer;
    try {
      // First, search for existing customer by Clerk user ID
      let customers = await stripe.customers.search({
        query: `metadata["clerkUserId"]:"${userId}"`,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log('Found existing customer by clerkUserId:', customer.id);
      } else if (userEmail) {
        // Fallback: search by email
        customers = await stripe.customers.search({
          query: `email:"${userEmail}"`,
          limit: 1,
        });

        if (customers.data.length > 0) {
          customer = customers.data[0];
          console.log('Found existing customer by email:', customer.id);
          
          // Update existing customer with clerkUserId metadata
          customer = await stripe.customers.update(customer.id, {
            metadata: { clerkUserId: userId },
          });
          console.log('Updated customer metadata with clerkUserId');
        } else {
          // Create new customer with email and metadata
          customer = await stripe.customers.create({
            email: userEmail,
            metadata: { clerkUserId: userId },
          });
          console.log('Created new customer:', customer.id);
        }
      } else {
        // Create customer without email (fallback)
        customer = await stripe.customers.create({
          metadata: { clerkUserId: userId },
        });
        console.log('Created new customer without email:', customer.id);
      }
    } catch (error) {
      console.error('Error creating/finding customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' }, 
        { status: 500 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
      metadata: {
        clerkUserId: userId,
        planName: planName,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' }, 
      { status: 500 }
    );
  }
} 