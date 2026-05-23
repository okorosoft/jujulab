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
          content: 'You are an expert HTML formatter. Convert the provided plain text to well-formatted HTML. Use appropriate HTML tags like <p>, <h1>, <h2>, <ul>, <li>, <strong>, <em>, etc. Only return the HTML code without any explanations or markdown code blocks.',
        },
        {
          role: 'user',
          content: `Convert the following text to HTML format:\n\n${text}`,
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
    console.error('Error in text to HTML conversion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert text to HTML' },
      { status: 500 }
    );
  }
}

