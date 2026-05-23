import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OpenAI API key is not configured');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

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

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { problem, conversationHistory = [] } = body;

    if (!problem || typeof problem !== 'string' || problem.trim().length === 0) {
      return NextResponse.json(
        { error: 'Math problem is required' },
        { status: 400 }
      );
    }

    // Build conversation messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an expert math tutor. Your task is to solve math problems step-by-step with clear, professional explanations.

CRITICAL FORMATTING RULES:
1. Use LaTeX notation for ALL mathematical expressions:
   - Inline math: \\( ... \\) or $ ... $
   - Display math: \\[ ... \\] or $$ ... $$
   - Examples: \\(x^2 + 5x - 3 = 0\\), \\[\\int_0^1 x^2 dx\\]
   - Fractions: \\frac{numerator}{denominator}
   - Square roots: \\sqrt{x} or \\sqrt[n]{x}
   - Powers: x^{n} or x^n
   - Subscripts: x_{n}
   - Greek letters: \\alpha, \\beta, \\gamma, \\theta, \\pi, etc.
   - Operators: \\sum, \\prod, \\int, \\lim, etc.

2. Structure your response professionally:
   - Start with "**Given:**" or "**Problem:**" stating the problem clearly
   - Use numbered steps: **Step 1:**, **Step 2:**, etc.
   - Show work clearly with proper mathematical notation
   - Use proper mathematical symbols and formatting
   - End with **Final Answer:** in a highlighted box format

3. For each step:
   - State what you're doing
   - Show the mathematical work using LaTeX
   - Explain why (the reasoning behind the step)

4. Use proper mathematical terminology and notation
5. Format equations clearly with proper spacing
6. Use mathematical symbols correctly (≠, ≤, ≥, ±, etc.)

Example format:
**Given:** Solve for x: \\(2x + 5 = 15\\)

**Step 1:** Subtract 5 from both sides
\\[2x + 5 - 5 = 15 - 5\\]
\\[2x = 10\\]

**Step 2:** Divide both sides by 2
\\[\\frac{2x}{2} = \\frac{10}{2}\\]
\\[x = 5\\]

**Final Answer:** \\(x = 5\\)

If this is a follow-up question, use the conversation history to provide context-aware answers.`
      },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: problem
      }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o (latest available), can be changed to gpt-4-turbo or gpt-4
      messages: messages,
      temperature: 0.3, // Lower temperature for more consistent, accurate math solutions
      max_tokens: 2000,
    });

    const solution = completion.choices[0]?.message?.content || 'Unable to generate solution.';

    return NextResponse.json({
      solution,
      model: completion.model,
      usage: completion.usage
    });
  } catch (error) {
    console.error('Error solving math problem:', error);
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}`, details: error },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

