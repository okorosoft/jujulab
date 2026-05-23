import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert grammar checker. Check the provided text for grammar errors and provide the corrected version. Wrap any newly added words or phrases with <mark> tags. For example, if you add "the" to "I went store", return "I went <mark>the</mark> store". Only return the corrected text with mark tags for additions, no explanations.',
        },
        {
          role: 'user',
          content: `Please check and correct the grammar in the following text. Wrap any newly added words with <mark> tags:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content || text;

    return NextResponse.json({
      result,
    });
  } catch (error: any) {
    console.error('Error in grammar check:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check grammar' },
      { status: 500 }
    );
  }
}

