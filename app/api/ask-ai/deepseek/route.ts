import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// Helper function to check and deduct credits
async function checkAndDeductCredits(userId: string, toolId: string, charactersUsed: number, imagesCount: number = 0): Promise<{ success: boolean; error?: string; remainingCredits?: number }> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
    const currentCredits = toolCredits[toolId] || 0;
    
    // For images: estimate ~1500 characters per image (includes GPT-4o Vision processing)
    const imageCredits = imagesCount * 1500;
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

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key is not configured' },
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

    // Count images (DeepSeek uses GPT-4o Vision for images, so higher cost)
    const imageCount = files.filter(file => file.type.startsWith('image/')).length;

    // Check and deduct credits before processing
    const creditCheck = await checkAndDeductCredits(userId, 'ask-ai', totalCharacters, imageCount);
    if (!creditCheck.success) {
      return NextResponse.json(
        { error: creditCheck.error },
        { status: 400 }
      );
    }

    // DeepSeek doesn't support images directly, so we'll extract text from images using GPT-4o Vision first
    let processedMessage = message || messages[messages.length - 1]?.content || '';
    
    if (files.some(file => file.type.startsWith('image/'))) {
      // For images, extract context using GPT-4o Vision first, then send to DeepSeek
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      const imagePromises = imageFiles.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return {
          type: 'image_url' as const,
          image_url: {
            url: `data:${file.type};base64,${base64}`,
          },
        };
      });

      const images = await Promise.all(imagePromises);
      
      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract and describe all text, content, and context from this image in detail.' },
              ...images as any,
            ],
          },
        ],
        max_tokens: 1000,
      });

      const imageContext = visionResponse.choices[0]?.message?.content || '';
      processedMessage = `${processedMessage}\n\nImage context: ${imageContext}`;
    }

    // Update last message with processed content
    const formattedMessages = messages.map((msg: any, index: number) => {
      if (index === messages.length - 1 && msg.role === 'user') {
        return {
          role: msg.role,
          content: processedMessage,
        };
      }
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'No response generated';

    const creditsUsed = totalCharacters + (imageCount * 1500); // Higher cost due to GPT-4o Vision processing

    return NextResponse.json({
      response: aiResponse,
      creditsUsed,
      remainingCredits: creditCheck.remainingCredits,
    });
  } catch (error: any) {
    console.error('Error in DeepSeek API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get response from DeepSeek' },
      { status: 500 }
    );
  }
}

