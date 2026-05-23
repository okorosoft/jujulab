import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { presignedUrl, fileData, contentType } = body;

    if (!presignedUrl || !fileData) {
      return NextResponse.json(
        { error: 'presignedUrl and fileData are required' },
        { status: 400 }
      );
    }

    // Convert base64 fileData back to binary
    const fileBuffer = Buffer.from(fileData, 'base64');

    // Upload to presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'x-amz-acl': 'private',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error:', errorText);
      return NextResponse.json(
        { error: 'Failed to upload image', details: errorText },
        { status: uploadResponse.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

