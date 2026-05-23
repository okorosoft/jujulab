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
    const { toolId } = body;

    if (!toolId) {
      return NextResponse.json(
        { error: 'Missing toolId' },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    // Free tools don't need to be purchased
    const freeToolIds = ['ai-humanize', 'ai-detector', 'word-counter', 'character-counter', 'ask-ai'];
    const isFreeTool = freeToolIds.includes(toolId);
    
    if (!isFreeTool) {
      // Check if tool is purchased (only for non-free tools)
      const purchasedTools = (user.publicMetadata?.purchasedTools as string[]) || [];
      if (!purchasedTools.includes(toolId)) {
        return NextResponse.json(
          { error: 'Tool not purchased. Please purchase the tool first.' },
          { status: 400 }
        );
      }
    }

    // Get activated tools
    const activatedTools = (user.publicMetadata?.activatedTools as string[]) || [];
    
    // Add to activated tools if not already activated
    if (!activatedTools.includes(toolId)) {
      activatedTools.push(toolId);
      
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          activatedTools,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Tool activated successfully' });
  } catch (error: any) {
    console.error('Error activating tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate tool' },
      { status: 500 }
    );
  }
}

