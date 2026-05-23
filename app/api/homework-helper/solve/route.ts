import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

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

    const body = await request.json();
    const { 
      question, 
      subject = 'Mathematics',
      answerMode = 'step-by-step',
      conversationHistory = [] 
    } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Build conversation messages
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert ${subject} tutor and homework helper. Your task is to help students understand and solve ${subject.toLowerCase()} problems.

${ANSWER_MODES[answerMode as keyof typeof ANSWER_MODES] || ANSWER_MODES['step-by-step']}

IMPORTANT GUIDELINES:
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

    // Add current question
    messages.push({
      role: 'user',
      content: question
    });

    // Call DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from AI service', details: errorText },
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
    console.error('Homework helper error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

