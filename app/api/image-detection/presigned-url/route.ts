import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

const IMAGE_DETECTION_API_KEY = process.env.IMAGE_DETECTION_API_KEY || process.env.UNDETECTABLE_API_KEY;
const IMAGE_DETECTION_API_URL = 'https://ai-image-detect.undetectable.ai';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - try auth() first, fallback to currentUser() if needed
    // This handles clock skew issues where JWT iat claim might be slightly in the future
    let userId: string | null = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
      
      // If auth() returned null userId, try currentUser() as fallback
      if (!userId) {
        console.warn('Auth() returned null userId, trying currentUser() as fallback');
        try {
          const user = await currentUser();
          userId = user?.id || null;
        } catch (userError) {
          console.error('currentUser() failed:', userError);
        }
      }
    } catch (authError: any) {
      // If auth() throws an error (e.g., clock skew issue), try currentUser() as fallback
      console.warn('Auth() failed, trying currentUser() as fallback:', authError.message);
      try {
        const user = await currentUser();
        userId = user?.id || null;
      } catch (userError) {
        console.error('Both auth() and currentUser() failed:', userError);
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 }
      );
    }

    if (!IMAGE_DETECTION_API_KEY) {
      return NextResponse.json(
        { error: 'Image detection API key not configured' },
        { status: 500 }
      );
    }

    // Get file name and content type from query parameters
    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get('file_name');
    const contentType = searchParams.get('content_type');

    if (!fileName) {
      return NextResponse.json(
        { error: 'file_name parameter is required' },
        { status: 400 }
      );
    }

    if (!contentType) {
      return NextResponse.json(
        { error: 'content_type parameter is required' },
        { status: 400 }
      );
    }

    // Remove spaces from filename as per API documentation
    const sanitizedFileName = fileName.replace(/\s+/g, '');

    // Request presigned URL from the image detection API
    const response = await fetch(
      `${IMAGE_DETECTION_API_URL}/get-presigned-url?file_name=${encodeURIComponent(sanitizedFileName)}&content_type=${encodeURIComponent(contentType)}`,
      {
        method: 'GET',
        headers: {
          'apikey': IMAGE_DETECTION_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Presigned URL API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get presigned URL', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

