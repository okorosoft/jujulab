import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { canAccessFeature } from '@/lib/subscription-utils';

const UNDETECTABLE_API_KEY = process.env.UNDETECTABLE_API_KEY;
const UNDETECTABLE_API_URL = process.env.UNDETECTABLE_API_URL || 'https://api.undetectable.ai';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check subscription access
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const accessCheck = canAccessFeature(user, 'rehumanization');
    
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { 
          error: accessCheck.reason || 'Rehumanization feature requires Pro plan or higher',
          upgradeRequired: accessCheck.upgradeRequired 
        },
        { status: 403 }
      );
    }

    if (!UNDETECTABLE_API_KEY) {
      return NextResponse.json(
        { error: 'Undetectable API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (!UNDETECTABLE_API_URL) {
      return NextResponse.json(
        { error: 'Undetectable API URL not configured' },
        { status: 500 }
      );
    }

    let response;
    try {
      response = await fetch(`${UNDETECTABLE_API_URL}/rehumanize`, {
        method: 'POST',
        headers: {
          'apikey': UNDETECTABLE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      if (fetchError.code === 'ENOTFOUND' || fetchError.message?.includes('getaddrinfo')) {
        return NextResponse.json(
          { 
            error: `Cannot connect to Undetectable API. Please check your UNDETECTABLE_API_URL environment variable. Current URL: ${UNDETECTABLE_API_URL}`,
            details: 'DNS resolution failed. Verify the API endpoint URL is correct.'
          },
          { status: 500 }
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Undetectable API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to rehumanize document via Undetectable API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error rehumanizing document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

