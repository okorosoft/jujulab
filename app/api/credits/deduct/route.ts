import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { toolId, charactersUsed, imagesUsed, videosUsed } = body;

    // Determine what type of credit deduction this is
    let creditsToDeduct = 0;
    let creditType = 'characters';
    
    if (toolId === 'ai-image-detection' && imagesUsed !== undefined) {
      creditsToDeduct = imagesUsed;
      creditType = 'images';
    } else if (toolId === 'ai-video-detection' && videosUsed !== undefined) {
      creditsToDeduct = videosUsed;
      creditType = 'videos';
    } else if (charactersUsed !== undefined) {
      creditsToDeduct = charactersUsed;
      creditType = 'characters';
    } else {
      return NextResponse.json(
        { error: 'Missing or invalid credit usage information' },
        { status: 400 }
      );
    }

    if (!toolId || creditsToDeduct <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid toolId or credit amount' },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    // Get current credits
    const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
    const currentCredits = toolCredits[toolId] || 0;
    
    // Check if user has enough credits
    if (currentCredits < creditsToDeduct) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          currentCredits,
          required: creditsToDeduct,
          creditType
        },
        { status: 400 }
      );
    }
    
    // Deduct credits
    toolCredits[toolId] = currentCredits - creditsToDeduct;
    
    // Update user metadata
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        toolCredits,
      },
    });

    return NextResponse.json({
      success: true,
      remainingCredits: toolCredits[toolId],
      deducted: creditsToDeduct,
      creditType,
    });
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deduct credits' },
      { status: 500 }
    );
  }
}

