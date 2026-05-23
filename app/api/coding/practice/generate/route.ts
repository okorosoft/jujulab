import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import PracticeChallenge from '@/models/PracticeChallenge';
import PracticeFolder from '@/models/PracticeFolder';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function checkCreditsAndPurchase(userId: string, toolId: string, creditsToDeduct: number) {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    const purchasedTools = (user.publicMetadata?.purchasedTools as string[]) || [];
    if (!purchasedTools.includes(toolId)) {
        return { success: false, error: 'Tool not purchased.', status: 403 };
    }

    const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
    const currentCredits = toolCredits[toolId] || 0;

    if (currentCredits < creditsToDeduct) {
        return { success: false, error: 'Insufficient credits.', status: 402 };
    }

    toolCredits[toolId] = currentCredits - creditsToDeduct;

    await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { ...user.publicMetadata, toolCredits },
    });

    return { success: true, remainingCredits: toolCredits[toolId] };
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { topic, numberOfQuestions = 1, difficulty, role, folderId } = await req.json();
        console.log('Generating practice for folderId:', folderId);

        if (!topic || !difficulty || !role || !folderId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Verify folder exists and belongs to user
        const folder = await PracticeFolder.findOne({ _id: folderId, userId });
        if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

        // Deduct credits (1000 per challenge generated)
        const creditsToDeduct = numberOfQuestions * 1000;
        const creditResult = await checkCreditsAndPurchase(userId, 'ai-practice', creditsToDeduct);

        if (!creditResult.success) {
            return NextResponse.json({ error: creditResult.error }, { status: creditResult.status });
        }

        const prompt = `Generate ${numberOfQuestions} coding challenge(s) for a ${role} position.
Topic: ${topic}
Difficulty: ${difficulty}

Return ONLY a raw JSON array with ${numberOfQuestions} challenge object(s). Each challenge should have the following structure:
{
    "title": "Short title",
    "description": "Problem statement in Markdown",
    "language": "programming language name",
    "codeTemplate": "initial code stub",
    "solutionCode": "COMPLETE working solution code",
    "testCases": [
        { "input": "...", "output": "...", "description": "..." }
    ],
    "timeLimit": "e.g. 30 min",
    "points": ${difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 50 : 100}
}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: 'You are an expert technical interviewer.' }, { role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        const aiResponse = completion.choices[0]?.message?.content;
        if (!aiResponse) throw new Error('No response from AI');

        const parsedData = JSON.parse(aiResponse);
        const challengesArray = Array.isArray(parsedData.challenges) ? parsedData.challenges : (Array.isArray(parsedData) ? parsedData : [parsedData]);

        const createdChallenges = [];
        for (const challengeData of challengesArray) {
            // Remove any potentially conflicting fields from AI response
            const { folderId: _f, userId: _u, _id: _i, ...cleanChallengeData } = challengeData;

            const challenge = await PracticeChallenge.create({
                userId,
                folderId: folder._id, // Use the verified folder ID from our database
                difficulty,
                ...cleanChallengeData,
                isAiGenerated: true
            });
            createdChallenges.push(challenge);
        }

        return NextResponse.json({
            success: true,
            count: createdChallenges.length,
            remainingCredits: creditResult.remainingCredits
        });

    } catch (error: any) {
        console.error('Practice Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Error generating practice' }, { status: 500 });
    }
}
