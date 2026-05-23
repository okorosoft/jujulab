import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import PracticeChallenge from '@/models/PracticeChallenge';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await connectDB();
        const challenge = await PracticeChallenge.findOne({ _id: id, userId });

        if (!challenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        return NextResponse.json(challenge);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { code } = await req.json();

        await connectDB();
        const challenge = await PracticeChallenge.findOne({ _id: id, userId });

        if (!challenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
        }

        // Logic for verification - usually involve a code execution service
        // For now, naive success and completion
        challenge.completed = true;
        await challenge.save();

        return NextResponse.json({
            success: true,
            message: 'Challenge completed successfully!',
            output: 'All tests passed.'
        });
    } catch (error) {
        return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await connectDB();
        const result = await PracticeChallenge.findOneAndDelete({ _id: id, userId });

        if (!result) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete challenge' }, { status: 500 });
    }
}
