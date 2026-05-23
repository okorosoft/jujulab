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
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert summarizer. Create a concise, well-structured summary of the provided text. Include:
1. A brief overview (2-3 sentences)
2. Key points in bullet form
3. Main conclusions or takeaways

Keep the summary comprehensive but not verbose. Focus on the most important information.`
        },
        {
          role: 'user',
          content: `Please summarize the following text:\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const summary = completion.choices[0]?.message?.content || 'Summary could not be generated';

    // Extract key points from the summary
    const keyPointsMatch = summary.match(/(?:Key points|Key Points|Bullet points|Bullets?|•|\-)\:?\s*\n?(.*?)(?:\n\n|\n[A-Z]|$)/s);
    const keyPoints = keyPointsMatch
      ? keyPointsMatch[1]
          .split(/\n\s*[•\-*]\s*/)
          .filter(point => point.trim().length > 0)
          .map(point => point.trim())
      : [];

    const processingTime = Date.now() - startTime;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

    return NextResponse.json({
      summary,
      keyPoints,
      wordCount,
      processingTime,
    });

  } catch (error) {
    console.error('Error in text summarizer:', error);
    return NextResponse.json(
      { error: 'Failed to summarize text' },
      { status: 500 }
    );
  }
}
