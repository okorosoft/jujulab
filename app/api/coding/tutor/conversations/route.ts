import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const conversations = await Conversation.find({ userId, tool: 'ai-tutor' })
            .sort({ lastMessageAt: -1 })
            .select('title lastMessageAt messages');

        const formatted = conversations.map(c => ({
            _id: c._id,
            title: c.title,
            lastMessageAt: c.lastMessageAt,
            messageCount: c.messages.length
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}
