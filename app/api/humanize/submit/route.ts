import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { DocumentStorage, generateDocumentTitle, getWordCount } from '@/lib/document-storage';
import { canProcessWords, getCurrentUsage } from '@/lib/usage-tracking';

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
    
    if (!UNDETECTABLE_API_KEY) {
      return NextResponse.json(
        { error: 'Undetectable API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { content, readability = 'High School', purpose = 'General Writing', strength = 'More Human', model = 'v11' } = body;

    if (!content || content.length < 50) {
      return NextResponse.json(
        { error: 'Content must be at least 50 characters long' },
        { status: 400 }
      );
    }

    // Calculate word count and validate usage
    const wordCount = getWordCount(content);
    
    // Check if user can process this many words
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    const validation = canProcessWords(user, wordCount);
    
    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.reason || 'Word limit exceeded',
          upgradeRequired: validation.upgradeRequired
        },
        { status: 403 }
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
      response = await fetch(`${UNDETECTABLE_API_URL}/submit`, {
        method: 'POST',
        headers: {
          'apikey': UNDETECTABLE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          readability,
          purpose,
          strength,
          model,
        }),
      });
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      // Handle DNS/network errors
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
      
      // Parse error message to provide more specific feedback
      let errorMessage = 'Failed to submit document to Undetectable API';
      try {
        const parsedError = JSON.parse(errorData);
        if (parsedError.error) {
          errorMessage = parsedError.error;
        }
      } catch (e) {
        // If parsing fails, use the raw error data
        errorMessage = errorData || errorMessage;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Store document in our database with user association
    const document = await DocumentStorage.createDocument(userId, {
      type: 'humanize',
      title: generateDocumentTitle('humanize', content),
      input: content,
      status: 'processing',
      wordCount,
      purpose,
      readability,
      strength,
      undetectableId: data.id
    });

    // Track usage after successful submission
    try {
      const clerk = await clerkClient();
      const currentUser = await clerk.users.getUser(userId);
      const currentUsage = getCurrentUsage(currentUser);
      const currentMonth = new Date().toISOString().substring(0, 7);
      
      // Update usage
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...currentUser.publicMetadata,
          totalWords: (currentUsage.totalWords || 0) + wordCount,
          humanizerWords: (currentUsage.humanizerWords || 0) + wordCount,
          monthlyUsage: {
            ...currentUsage.monthlyUsage,
            [currentMonth]: (currentUsage.monthlyUsage[currentMonth] || 0) + wordCount
          }
        }
      });
    } catch (error) {
      // Log but don't fail the request if usage tracking fails
      console.error('Failed to track usage:', error);
    }
    
    return NextResponse.json({
      ...data,
      documentId: document.id // Return our internal document ID
    });
  } catch (error) {
    console.error('Error submitting document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
