import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import Lesson from '@/models/Lesson';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function checkCreditsAndPurchase(userId: string, toolId: string, creditsToDeduct: number) {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    // 1. Check if tool is purchased
    const purchasedTools = (user.publicMetadata?.purchasedTools as string[]) || [];
    if (!purchasedTools.includes(toolId)) {
        return { success: false, error: 'Tool not purchased. Please visit the Market to unlock this tool.', status: 403 };
    }

    // 2. Check and deduct credits
    const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
    const currentCredits = toolCredits[toolId] || 0;

    if (currentCredits < creditsToDeduct) {
        return {
            success: false,
            error: `Insufficient credits. You have ${currentCredits.toLocaleString()} characters, but this request needs ${creditsToDeduct.toLocaleString()}.`,
            status: 402,
        };
    }

    // Deduct credits
    toolCredits[toolId] = currentCredits - creditsToDeduct;

    await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
            ...user.publicMetadata,
            toolCredits,
        },
    });

    return { success: true, remainingCredits: toolCredits[toolId] };
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { topic, language, difficulty, objectives, duration } = await req.json();

        if (!topic || !language || !difficulty || !objectives) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Connect to DB
        await connectDB();

        // Check credits/purchase (Lessons cost 2000 credits/characters estimated for generation)
        const creditsToDeduct = 2000;
        const creditResult = await checkCreditsAndPurchase(userId, 'ai-lessons', creditsToDeduct);

        if (!creditResult.success) {
            return NextResponse.json({ error: creditResult.error }, { status: creditResult.status });
        }

        const prompt = `You are an expert programming instructor. Create a comprehensive coding lesson with the following details:

Topic: ${topic}
Programming Language: ${language}
Difficulty Level: ${difficulty}
Learning Objectives: ${objectives}
Duration: ${duration || '15 min'}

Please generate a structured lesson that includes:
1. A clear, engaging title
2. A brief description (1-2 sentences)
3. Detailed lesson content with explanations and examples
4. A code template for students to practice with
5. Expected output for the practice exercise
6. 3-4 helpful hints for students

Format your response as a JSON object with these exact keys:
{
  "title": "concise lesson title",
  "description": "brief description",
  "content": "detailed lesson content with markdown formatting, code examples, and explanations",
  "codeTemplate": "starter code for students",
  "expectedOutput": "what the code should produce",
  "hints": ["hint1", "hint2", "hint3"]
}

Make the lesson engaging, clear, and appropriate for the ${difficulty} difficulty level.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are an expert programming instructor who creates clear, engaging, and educational coding lessons.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
        });

        const aiResponse = completion.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error('No response from AI');
        }

        const lessonData = JSON.parse(aiResponse);

        // Save to DB
        const lesson = await Lesson.create({
            userId,
            title: lessonData.title,
            description: lessonData.description,
            language,
            difficulty,
            duration: duration || '15 min',
            content: lessonData.content,
            codeTemplate: lessonData.codeTemplate,
            expectedOutput: lessonData.expectedOutput,
            hints: lessonData.hints || [],
        });

        return NextResponse.json({
            success: true,
            lessonId: lesson._id,
            remainingCredits: creditResult.remainingCredits
        });

    } catch (error: any) {
        console.error('Lesson Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Error generating lesson' }, { status: 500 });
    }
}
