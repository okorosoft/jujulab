import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Lesson from '@/models/Lesson';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const lessons = await Lesson.find({ userId })
            .sort({ createdAt: -1 })
            .select('title description language difficulty duration completed progress createdAt');

        return NextResponse.json({ success: true, lessons });
    } catch (error: any) {
        console.error('Error fetching lessons:', error);
        return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
    }
}
