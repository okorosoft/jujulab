import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await connectDB();
        const conversation = await Conversation.findOne({ _id: id, userId });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        return NextResponse.json({
            _id: conversation._id,
            title: conversation.title,
            messages: conversation.messages
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }
}
