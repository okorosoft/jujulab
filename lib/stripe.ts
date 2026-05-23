import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<any>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export const redirectToStripeCheckout = async (priceId: string, planName: string) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        planName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
};

export const getUserSubscription = (user: any) => {
  if (!user?.publicMetadata) {
    return {
      planName: 'free',
      subscriptionStatus: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    };
  }

  return {
    planName: user.publicMetadata.planName || 'free',
    subscriptionStatus: user.publicMetadata.subscriptionStatus || 'active',
    cancelAtPeriodEnd: user.publicMetadata.cancelAtPeriodEnd || false,
    currentPeriodEnd: user.publicMetadata.currentPeriodEnd 
      ? new Date(user.publicMetadata.currentPeriodEnd * 1000)
      : null,
    stripeCustomerId: user.publicMetadata.stripeCustomerId,
    subscriptionId: user.publicMetadata.subscriptionId,
  };
}; 