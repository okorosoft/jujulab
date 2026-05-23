import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Try auth() first, fallback to currentUser() if needed (handles clock skew)
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError: any) {
      console.warn('Auth() failed, trying currentUser() as fallback:', authError.message);
    }

    // If userId is still null after auth(), try currentUser()
    if (!userId) {
      try {
        const user = await currentUser();
        userId = user?.id || null;
      } catch (userError) {
        console.error('Both auth() and currentUser() failed:', userError);
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    // Get tool credits from user metadata
    const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
    
    return NextResponse.json({ credits: toolCredits });
  } catch (error: any) {
    console.error('Error getting credits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get credits' },
      { status: 500 }
    );
  }
}

