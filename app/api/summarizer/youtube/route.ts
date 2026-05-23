import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Supadata } from '@supadata/js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getYouTubeTranscript(videoUrl: string) {
  if (!process.env.SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY is not configured');
  }

  // Initialize Supadata client
  const supadata = new Supadata({
    apiKey: process.env.SUPADATA_API_KEY,
  });

  // Get transcript using Supadata SDK
  const transcript = await supadata.youtube.transcript({
    url: videoUrl,
    text: true, // Request plain text instead of timestamped chunks
  });

  // Handle both string and array responses
  let transcriptText = '';
  if (typeof transcript.content === 'string') {
    transcriptText = transcript.content;
  } else if (Array.isArray(transcript.content)) {
    // If it's an array of chunks, extract text from each chunk
    transcriptText = transcript.content
      .map((chunk: any) => chunk.text || '')
      .filter((text: string) => text.trim().length > 0)
      .join(' ');
  }

  return {
    transcript: transcriptText,
    lang: transcript.lang,
    availableLangs: transcript.availableLangs,
  };
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Get video transcript from Supadata
    const videoData = await getYouTubeTranscript(url);

    console.log('Video data received:', {
      hasTranscript: !!videoData.transcript,
      transcriptType: typeof videoData.transcript,
      transcriptLength: videoData.transcript?.length || 0,
      lang: videoData.lang,
      availableLangs: videoData.availableLangs,
    });

    // Validate transcript content
    const transcriptText = typeof videoData.transcript === 'string' ? videoData.transcript : '';
    console.log('Transcript text after processing:', {
      isEmpty: !transcriptText || transcriptText.trim().length === 0,
      length: transcriptText?.length || 0,
      preview: transcriptText?.substring(0, 100) || 'empty',
    });

    if (!transcriptText || transcriptText.trim().length === 0) {
      console.log('No transcript content found, returning error');
      return NextResponse.json(
        { error: 'No transcript is available for this video please try different video' },
        { status: 400 }
      );
    }

    // Create study notes using GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert note-taker and educator. Create well-structured study notes using HTML formatting.

Your response must follow these strict rules:

1. Start with an <h1> tag containing a descriptive title

2. Use semantic HTML elements properly:

   - <h1> for the main title

   - <h2> for section headings

   - <p> for paragraphs

   - <ul> and <li> for bullet points

   - <strong> for important terms

   - <table>, <tr>, and <td> for tables if needed

3. Do not include any markdown or non-HTML formatting

4. Do not include any text outside of HTML tags

5. Do not include DOCTYPE, XML declarations, or HTML comments

6. Do not include <html>, <head>, or <body> tags

7. Ensure all HTML tags are properly closed

8. Use only the specified HTML elements - no other tags allowed

9. Create a clear hierarchy of information with main concepts and supporting details`
        },
        {
          role: 'user',
          content: `Create comprehensive study notes from the following YouTube video transcript:

${transcriptText.substring(0, 15000)}

Please structure the notes with:

1. Start with a clear title using <h1> tags

2. Use <h2> tags for main sections

3. Use <p> tags for paragraphs

4. Use <ul> and <li> tags for bullet points

5. Use <strong> tags for important terms

6. Include key concepts, definitions, and examples

7. Organize the content in a logical, hierarchical structure

8. Add a summary section at the beginning

9. Highlight key takeaways at the end

Format the entire response in clean HTML without any markdown or other formatting.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
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

    return NextResponse.json({
      summary,
      keyPoints,
      processingTime,
      videoId,
      lang: videoData.lang,
      availableLangs: videoData.availableLangs,
    });

  } catch (error: any) {
    console.error('Error in YouTube summarizer:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('SUPADATA_API_KEY')) {
      return NextResponse.json(
        { error: 'Supadata API key is not configured. Please add SUPADATA_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('transcript') || error.message?.includes('No transcript')) {
      return NextResponse.json(
        { error: 'No transcript is available for this video please try different video' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to summarize YouTube video' },
      { status: 500 }
    );
  }
}
