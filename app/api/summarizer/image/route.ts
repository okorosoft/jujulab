import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to check and deduct credits for images
// For summarizer, images are processed as text extraction + summarization
// Estimate: 1 image = ~2000 characters (conservative estimate for OCR + summary)
async function checkAndDeductImageCredits(userId: string, toolId: string, imagesCount: number = 1): Promise<{ success: boolean; error?: string; remainingCredits?: number }> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
    const currentCredits = toolCredits[toolId] || 0;
    
    // Estimate: 1 image = ~2000 characters (OCR + summarization)
    const estimatedCharacters = imagesCount * 2000;
    
    if (currentCredits < estimatedCharacters) {
      return {
        success: false,
        error: `Insufficient credits. You have ${currentCredits.toLocaleString()} characters, but need ${estimatedCharacters.toLocaleString()} for image processing.`,
      };
    }
    
    // Deduct credits
    toolCredits[toolId] = currentCredits - estimatedCharacters;
    
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        toolCredits,
      },
    });
    
    return {
      success: true,
      remainingCredits: toolCredits[toolId],
    };
  } catch (error: any) {
    console.error('Error checking/deducting credits:', error);
    return {
      success: false,
      error: 'Failed to process credits',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are supported' },
        { status: 400 }
      );
    }

    // Check file size (limit to 5MB for images)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image file size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Check and deduct credits before processing (1 image = ~2000 chars)
    const creditCheck = await checkAndDeductImageCredits(userId, 'summarizer', 1);
    if (!creditCheck.success) {
      return NextResponse.json(
        { error: creditCheck.error },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;

    // Extract text from image using GPT-4o Vision
    const visionCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting and understanding text from images. Analyze the provided image and extract all visible text, diagrams, charts, or other visual content. Provide a comprehensive description of what you see, including any text content, data, or information displayed in the image.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this image and extract all text and information from it:'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const extractedText = visionCompletion.choices[0]?.message?.content || 'Could not extract text from image';

    // Now summarize the extracted content
    const summaryCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert content summarizer. Create a concise, well-structured summary of the extracted image content. Include:
1. A brief overview of what the image contains
2. Key information, text, or data extracted from the image in bullet form
3. Main insights or conclusions that can be drawn from the visual content

Focus on the most important and relevant information extracted from the image. Keep the summary comprehensive but not verbose.`
        },
        {
          role: 'user',
          content: `Please summarize the content extracted from this image:\n\n${extractedText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const summary = summaryCompletion.choices[0]?.message?.content || 'Summary could not be generated';

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
      extractedText,
      creditsUsed: 2000, // 1 image = 2000 characters
      remainingCredits: creditCheck.remainingCredits,
    });

  } catch (error) {
    console.error('Error in image summarizer:', error);
    return NextResponse.json(
      { error: 'Failed to summarize image' },
      { status: 500 }
    );
  }
}
