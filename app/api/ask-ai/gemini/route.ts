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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
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

    // Convert messages to Gemini format
    const geminiMessagesPromises = messages.map(async (msg: any, index: number) => {
      const parts: any[] = [];
      
      // Add text content
      if (index === messages.length - 1 && msg.role === 'user') {
        parts.push({ text: message || msg.content || 'See attached files' });
      } else {
        parts.push({ text: msg.content });
      }
      
      // Add images if this is the last user message
      if (index === messages.length - 1 && msg.role === 'user' && files.some(f => f.type.startsWith('image/'))) {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        for (const file of imageFiles) {
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          parts.push({
            inline_data: {
              mime_type: file.type,
              data: base64,
            },
          });
        }
      }
      
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    const geminiMessages = await Promise.all(geminiMessagesPromises);

    // Use  gemini-2.5-pro
    const hasImages = files.some(file => file.type.startsWith('image/'));
    const model = hasImages ? 'gemini-2.5-pro' : 'gemini-2.5-pro';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    const creditsUsed = totalCharacters + (imageCount * 1000);

    return NextResponse.json({
      response: aiResponse,
      creditsUsed,
      remainingCredits: creditCheck.remainingCredits,
    });
  } catch (error: any) {
    console.error('Error in Gemini API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get response from Gemini' },
      { status: 500 }
    );
  }
}

