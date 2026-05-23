import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

if (!DEEPSEEK_API_KEY) {
  console.error('DeepSeek API key is not configured');
}

// Answer modes mapping
const ANSWER_MODES = {
  'pure-answer': 'Pure Answer - Provide only the final answer without explanation.',
  'detailed-explanation': 'Detailed Explanation - Provide a comprehensive explanation with context and background information.',
  'step-by-step': 'Step-by-Step - Break down the solution into clear, numbered steps showing each part of the process.',
  'study-guide': 'Study Guide - Provide quick formulas, key points, and important concepts related to this problem.',
  'correct-question': 'Correct Question - If there are any errors in the question, point them out and provide the corrected version with explanation.',
  'generate-question': 'Generate Question - Create similar practice questions based on the same concept to reinforce learning.'
};

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

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { 
      imageBase64,
      question = '',
      subject = 'Mathematics',
      answerMode = 'step-by-step',
      conversationHistory = [] 
    } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Build conversation messages
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert ${subject} tutor and homework helper. Your task is to help students understand and solve ${subject.toLowerCase()} problems from images.

${ANSWER_MODES[answerMode as keyof typeof ANSWER_MODES] || ANSWER_MODES['step-by-step']}

IMPORTANT GUIDELINES:
- Analyze the image carefully and identify all visible text, diagrams, equations, and problems
- Always provide clear, educational explanations
- Use proper mathematical notation and formatting when applicable
- Break down complex concepts into understandable parts
- Encourage learning and understanding, not just giving answers
- If the question is unclear or has errors, point them out politely
- Use LaTeX notation for mathematical expressions: inline math with \\(...\\) or $...$, display math with \\[...\\] or $$...$$
- Format your response professionally with clear sections

Subject: ${subject}
Answer Mode: ${answerMode}`
      }
    ];

    // Add conversation history
    conversationHistory.forEach((msg: any) => {
      if (msg.role && msg.content) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });

    // Step 1: Use GPT-4o Vision to analyze the image and extract text/context
    console.log('Step 1: Analyzing image with GPT-4o Vision...');
    
    const visionPrompt = question.trim() 
      ? `${question}\n\nPlease analyze this image carefully and extract all text, equations, diagrams, and problem details. Provide a clear description of what you see in the image.`
      : 'Please analyze this image carefully. Extract all visible text, equations, diagrams, and problem details. Provide a comprehensive description of the homework problem shown in the image.';

    const visionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are an expert at analyzing images and extracting text, mathematical equations, diagrams, and problem details. Provide clear, detailed descriptions of what you see in images.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: visionPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ];

    let imageContext = '';
    try {
      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: visionMessages,
        max_tokens: 2000
      });

      imageContext = visionResponse.choices[0]?.message?.content || '';
      console.log('Image context extracted:', imageContext.substring(0, 200) + '...');
    } catch (visionError: any) {
      console.error('GPT-4o Vision error:', visionError);
      return NextResponse.json(
        { error: 'Failed to analyze image', details: visionError.message },
        { status: 500 }
      );
    }

    if (!imageContext.trim()) {
      return NextResponse.json(
        { error: 'Could not extract content from image' },
        { status: 400 }
      );
    }

    // Step 2: Send the extracted context to DeepSeek for homework solving
    console.log('Step 2: Sending context to DeepSeek...');
    
    const userMessageContent = question.trim()
      ? `${question}\n\nHere is the content extracted from the image:\n\n${imageContext}`
      : `Please help me solve this homework problem. Here is the content extracted from the image:\n\n${imageContext}`;

    const userMessage: any = {
      role: 'user',
      content: userMessageContent
    };

    messages.push(userMessage);

    const requestBody = {
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000
    };

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from DeepSeek API', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'No response generated';

    return NextResponse.json({
      answer,
      subject,
      answerMode
    });

  } catch (error: any) {
    console.error('Homework helper image error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

