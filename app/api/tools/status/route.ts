import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
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
        { error: 'Unauthorized - Please sign in again' },
        { status: 401 }
      );
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    // Get purchased and activated tools from user metadata
    const purchasedTools = (user.publicMetadata?.purchasedTools as string[]) || [];
    const activatedTools = (user.publicMetadata?.activatedTools as string[]) || [];

    // Free tools (no purchase needed, but can be activated/deactivated)
    const freeToolIds = ['ai-humanize', 'ai-detector', 'word-counter', 'character-counter', 'ask-ai'];

    // Build tool statuses object
    const tools: Record<string, { purchased: boolean; activated: boolean }> = {};

    // Get all tool IDs (you can import from tool-definitions if needed)
    const allToolIds = [
      'ai-humanize', 'ai-detector', 'ai-image-detection', 'ai-video-detection',
      'grammar-check', 'spell-check', 'plagiarism-check', 'translator',
      'html-to-text', 'text-to-html', 'pdf-to-html',
      'word-counter', 'character-counter', 'summarizer', 'ask-ai',
      'ai-homework-helper', 'ai-math-solver',
      'code-translator', 'ai-lessons', 'ai-practice', 'ai-tutor'
    ];

    allToolIds.forEach(toolId => {
      const isFree = freeToolIds.includes(toolId);
      tools[toolId] = {
        purchased: isFree ? true : purchasedTools.includes(toolId), // Free tools are always "purchased"
        activated: activatedTools.includes(toolId),
      };
    });

    return NextResponse.json({ tools });
  } catch (error: any) {
    console.error('Error getting tool statuses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tool statuses' },
      { status: 500 }
    );
  }
}

