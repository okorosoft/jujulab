import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import PracticeFolder from '@/models/PracticeFolder';
import PracticeChallenge from '@/models/PracticeChallenge';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const folders = await PracticeFolder.find({ userId }).sort({ createdAt: -1 });
        return NextResponse.json(folders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name } = await req.json();
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        await connectDB();
        const folder = await PracticeFolder.create({ userId, name });
        return NextResponse.json(folder);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await connectDB();

        // Delete challenges first
        await PracticeChallenge.deleteMany({ folderId: id, userId });

        // Delete folder
        const folder = await PracticeFolder.findOneAndDelete({ _id: id, userId });

        if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
    }
}
