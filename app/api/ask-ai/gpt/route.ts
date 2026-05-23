import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to check and deduct credits
async function checkAndDeductCredits(userId: string, toolId: string, charactersUsed: number, imagesCount: number = 0): Promise<{ success: boolean; error?: string; remainingCredits?: number }> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
    const currentCredits = toolCredits[toolId] || 0;
    
    // For images: estimate ~1000 characters per image
    const imageCredits = imagesCount * 1000;
    const totalCredits = charactersUsed + imageCredits;
    
    if (currentCredits < totalCredits) {
      return {
        success: false,
        error: `Insufficient credits. You have ${currentCredits.toLocaleString()} characters, but need ${totalCredits.toLocaleString()}.`,
      };
    }
    
    // Deduct credits
    toolCredits[toolId] = currentCredits - totalCredits;
    
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
    const message = formData.get('message') as string;
    const messagesJson = formData.get('messages') as string;
    const messages = messagesJson ? JSON.parse(messagesJson) : [];

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Get all files from formData
    const files: File[] = [];
    let fileIndex = 0;
    while (formData.get(`file_${fileIndex}`)) {
      const file = formData.get(`file_${fileIndex}`) as File;
      files.push(file);
      fileIndex++;
    }

    // Calculate characters from messages
    const totalCharacters = messages.reduce((sum: number, msg: any) => {
      return sum + (msg.content?.length || 0);
    }, 0);

    // Count images
    const imageCount = files.filter(file => file.type.startsWith('image/')).length;

    // Check and deduct credits before processing
    const creditCheck = await checkAndDeductCredits(userId, 'ask-ai', totalCharacters, imageCount);
    if (!creditCheck.success) {
      return NextResponse.json(
        { error: creditCheck.error },
        { status: 400 }
      );
    }

    // Build messages with images if any
    const formattedMessages = messages.map((msg: any) => {
      if (msg.role === 'user' && files.length > 0) {
        const content: any[] = [{ type: 'text', text: msg.content || message || 'See attached files' }];
        
        // Add images to content
        files.forEach((file) => {
          if (file.type.startsWith('image/')) {
            // For images, we'll need to convert to base64
            // This will be handled in the frontend and sent as base64
          }
        });
        
        return {
          role: msg.role,
          content: msg.content || message || 'See attached files',
        };
      }
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    // If there are image files, use GPT-4o Vision
    const hasImages = files.some(file => file.type.startsWith('image/'));
    
    if (hasImages) {
      // Convert images to base64
      const imagePromises = files
        .filter(file => file.type.startsWith('image/'))
        .map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return {
            type: 'image_url',
            image_url: {
              url: `data:${file.type};base64,${base64}`,
            },
          };
        });

      const images = await Promise.all(imagePromises);
      
      // Update last user message with images
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      if (lastMessage.role === 'user') {
        formattedMessages[formattedMessages.length - 1] = {
          role: 'user',
          content: [
            { type: 'text', text: lastMessage.content },
            ...images,
          ],
        };
      }
    }

    const completion = await openai.chat.completions.create({
      model: hasImages ? 'gpt-4o' : 'gpt-4o',
      messages: formattedMessages as any,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';

    const creditsUsed = totalCharacters + (imageCount * 1000);

    return NextResponse.json({
      response,
      creditsUsed,
      remainingCredits: creditCheck.remainingCredits,
    });
  } catch (error: any) {
    console.error('Error in GPT API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get response from GPT' },
      { status: 500 }
    );
  }
}

