import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import PracticeChallenge from '@/models/PracticeChallenge';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const challenges = await PracticeChallenge.find({ userId }).select('_id folderId');
        return NextResponse.json(challenges);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
    }
}
