import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

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

        const { message, conversationId } = await req.json();
        if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

        // Deduct 100 credits per message
        const creditResult = await checkCreditsAndPurchase(userId, 'ai-tutor', 100);
        if (!creditResult.success) {
            return NextResponse.json({ error: creditResult.error }, { status: creditResult.status });
        }

        await connectDB();

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findOne({ _id: conversationId, userId });
        }

        if (!conversation) {
            conversation = await Conversation.create({
                userId,
                title: message.substring(0, 40) + (message.length > 40 ? '...' : ''),
                tool: 'ai-tutor',
                messages: []
            });
        }

        const chatHistory = conversation.messages.map((m: any) => ({
            role: m.role,
            content: m.content
        }));

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are an expert AI Coding Tutor and Problem Solver. Help the user with their coding questions, debugging, and architectural advice.' },
                ...chatHistory,
                { role: 'user', content: message }
            ]
        });

        const aiMessage = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

        conversation.messages.push({ role: 'user', content: message, timestamp: new Date() });
        conversation.messages.push({ role: 'assistant', content: aiMessage, timestamp: new Date() });
        conversation.lastMessageAt = new Date();
        await conversation.save();

        return NextResponse.json({
            message: aiMessage,
            conversationId: conversation._id,
            remainingCredits: creditResult.remainingCredits
        });

    } catch (error: any) {
        console.error('AI Tutor Chat Error:', error);
        return NextResponse.json({ error: 'Failed to get response from AI Tutor' }, { status: 500 });
    }
}
