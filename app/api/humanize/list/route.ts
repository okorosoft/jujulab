import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { DocumentStorage } from '@/lib/document-storage';

export async function POST(request: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;
    
    if (!userId) {
      console.error('Auth() returned null userId. Headers:', {
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'user-agent': request.headers.get('user-agent'),
        'cookie': request.headers.get('cookie') ? 'present' : 'missing'
      });
      return NextResponse.json(
        { error: 'Authentication required - Please sign in again' },
        { status: 401 }
      );
    }

    // Get user's documents from our storage (available to all authenticated users)
    const clerk = await clerkClient();
    const documents = await DocumentStorage.getDocumentsByUser(userId);
    
    // Get usage statistics
    const usageStats = await DocumentStorage.getUserUsageStats(userId);

    return NextResponse.json({
      documents: documents,
      total: documents.length,
      usageStats: usageStats
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
