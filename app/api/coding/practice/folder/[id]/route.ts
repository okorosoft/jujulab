import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import PracticeFolder from '@/models/PracticeFolder';
import PracticeChallenge from '@/models/PracticeChallenge';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await connectDB();

        const folder = await PracticeFolder.findOne({ _id: id, userId });
        if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

        const challenges = await PracticeChallenge.find({ folderId: id, userId }).sort({ createdAt: -1 });

        return NextResponse.json({
            folder,
            challenges
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch folder data' }, { status: 500 });
    }
}
