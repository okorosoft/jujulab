import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const VIDEO_DETECTION_API_KEY = process.env.VIDEO_DETECTION_API_KEY || process.env.UNDETECTABLE_API_KEY;
const VIDEO_DETECTION_API_URL = 'https://ai-video-detect.undetectable.ai';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      console.error('No userId found in auth()');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!VIDEO_DETECTION_API_KEY) {
      return NextResponse.json(
        { error: 'Video detection API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    // Query detection status and results
    const response = await fetch(`${VIDEO_DETECTION_API_URL}/query`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Query API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to query detection status', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error querying detection status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

