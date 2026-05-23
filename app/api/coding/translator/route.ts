import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import DocumentModel from '@/lib/models/Document';
import { getWordCount } from '@/lib/document-storage';

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

        const { inputLanguage, outputLanguage, inputCode } = await req.json();
        if (!inputCode) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

        // Deduct 1 credit per character
        const creditsToDeduct = inputCode.length;
        const creditResult = await checkCreditsAndPurchase(userId, 'code-translator', creditsToDeduct);

        if (!creditResult.success) {
            return NextResponse.json({ error: creditResult.error }, { status: creditResult.status });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert code translator. Translate the following code from ${inputLanguage} to ${outputLanguage}. Maintain the same logic and structure. Return ONLY the translated code, no explanations.`
                },
                { role: 'user', content: inputCode }
            ],
            stream: true,
        });

        // Save to Documents in background (don't await to keep response fast)
        (async () => {
            try {
                await connectDB();
                await DocumentModel.create({
                    userId,
                    type: 'translator',
                    title: `Code Translation: ${inputLanguage} to ${outputLanguage}`,
                    input: inputCode,
                    status: 'completed',
                    wordCount: getWordCount(inputCode),
                });
            } catch (err) {
                console.error('Error saving translation document:', err);
            }
        })();

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    controller.enqueue(new TextEncoder().encode(content));
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain' },
        });

    } catch (error: any) {
        console.error('Code Translation Error:', error);
        return NextResponse.json({ error: 'Failed to translate code' }, { status: 500 });
    }
}
