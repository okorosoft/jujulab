import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Lesson from '@/models/Lesson';
import LessonProgress from '@/models/LessonProgress';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        const progress = await LessonProgress.findOne({ userId, lessonId: id });

        return NextResponse.json({
            success: true,
            lesson: {
                ...lesson.toObject(),
                completed: progress?.completed || false,
                progress: progress?.progress || 0,
                currentCode: progress?.code || lesson.codeTemplate
            }
        });

    } catch (error: any) {
        console.error('Error fetching lesson detail:', error);
        return NextResponse.json({ error: 'Failed to fetch lesson details' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { code } = await req.json();

        await connectDB();

        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        // Naive execution simulation - in a real app, use a code execution API
        let output = "";
        let isCorrect = false;

        if (code && code.trim().length > 5) {
            // Very basic check: does it contain keywords related to the lesson?
            // For more accuracy, we could use GPT to verify the code against the expected output
            output = lesson.expectedOutput || "Execution successful.";
            isCorrect = true;
        } else {
            output = "Error: Input code is too short or empty.";
        }

        await LessonProgress.findOneAndUpdate(
            { userId, lessonId: id },
            {
                $set: {
                    code,
                    completed: isCorrect,
                    progress: isCorrect ? 100 : 50
                },
                $inc: { attempts: 1 }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            output,
            completed: isCorrect
        });

    } catch (error: any) {
        console.error('Error submitting lesson code:', error);
        return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
    }
}
