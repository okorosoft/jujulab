import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'HTML text is required' },
        { status: 400 }
      );
    }

    // Simple HTML to text conversion
    let result = text
      // Remove script and style tags with their content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Replace common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Replace block elements with newlines
      .replace(/<\/?(p|div|h[1-6]|li|tr|td|th|br)[^>]*>/gi, '\n')
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Clean up multiple newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim();

    return NextResponse.json({
      result,
    });
  } catch (error: any) {
    console.error('Error in HTML to text conversion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert HTML to text' },
      { status: 500 }
    );
  }
}

