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
    
    // Get activated tools
    const activatedTools = (user.publicMetadata?.activatedTools as string[]) || [];
    
    // Remove from activated tools
    const updatedActivatedTools = activatedTools.filter(id => id !== toolId);
    
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        activatedTools: updatedActivatedTools,
      },
    });

    return NextResponse.json({ success: true, message: 'Tool deactivated successfully' });
  } catch (error: any) {
    console.error('Error deactivating tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate tool' },
      { status: 500 }
    );
  }
}

