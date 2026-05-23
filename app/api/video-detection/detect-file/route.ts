import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

const VIDEO_DETECTION_API_KEY = process.env.VIDEO_DETECTION_API_KEY || process.env.UNDETECTABLE_API_KEY;
const VIDEO_DETECTION_API_URL = 'https://ai-video-detect.undetectable.ai';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - try auth() first, fallback to currentUser() if needed
    let userId: string | null = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError: any) {
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

    if (!VIDEO_DETECTION_API_KEY) {
      return NextResponse.json(
        { error: 'Video detection API key not configured' },
        { status: 500 }
      );
    }

    // Check credits before processing
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
    const currentCredits = toolCredits['ai-video-detection'] || 0;
    
    if (currentCredits < 1) {
      return NextResponse.json(
        { error: `Insufficient credits. You have ${currentCredits} videos, but need 1.` },
        { status: 400 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string || 'Video';
    const email = formData.get('email') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    const validExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP4, MOV, AVI, WebM, or MKV files only.' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit for videos)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Prepare form data for API
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('document_type', documentType);
    if (email) {
      apiFormData.append('email', email);
    }

    // Submit video for detection
    const response = await fetch(`${VIDEO_DETECTION_API_URL}/detect-file`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'key': VIDEO_DETECTION_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Detect file API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to submit video for detection', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Deduct 1 video credit after successful detection submission
    toolCredits['ai-video-detection'] = currentCredits - 1;
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        toolCredits,
      },
    });

    return NextResponse.json({
      ...data,
      creditsUsed: 1,
      remainingCredits: toolCredits['ai-video-detection'],
    });
  } catch (error) {
    console.error('Error submitting video for detection:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

