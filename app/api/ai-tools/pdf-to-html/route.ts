import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    // Convert PDF file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    // Use inline_data for PDF (similar to images)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Convert this PDF document to well-formatted HTML. Preserve all formatting, headings, lists, tables, and structure. Return only the HTML code without any explanations, markdown code blocks, DOCTYPE, html, head, or body tags - just the content HTML.',
                },
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 32768, // Maximum for gemini-2.5-pro
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for finish reason
    const finishReason = data.candidates?.[0]?.finishReason;
    const candidate = data.candidates?.[0];
    
    // Try multiple paths to extract the result
    let result = 
      candidate?.content?.parts?.[0]?.text ||
      candidate?.content?.parts?.find((p: any) => p.text)?.text ||
      data.text ||
      '';

    // Handle MAX_TOKENS case - check if there's partial content
    if (finishReason === 'MAX_TOKENS') {
      if (result) {
        // We have partial content, warn but return it
        console.warn('Response was truncated due to token limit. Partial content returned.');
      } else {
        // No content at all - might need to check other response structures
        console.error('MAX_TOKENS hit but no content found. Response:', JSON.stringify(data, null, 2));
        throw new Error('The PDF is too large or complex. The conversion exceeded the maximum token limit. Please try with a smaller PDF or split it into parts.');
      }
    }

    // If still empty, check for other error reasons
    if (!result) {
      if (finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please try a different PDF.');
      } else if (finishReason === 'RECITATION') {
        throw new Error('Content was blocked due to recitation concerns.');
      } else {
        console.error('Empty result from Gemini. Finish reason:', finishReason, 'Full response:', JSON.stringify(data, null, 2));
        throw new Error('No content generated. The PDF might be too complex or the file might not be processed yet.');
      }
    }

    // Clean up markdown code blocks if present
    result = result.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    return NextResponse.json({
      result,
    });
  } catch (error: any) {
    console.error('Error in PDF to HTML conversion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert PDF to HTML' },
      { status: 500 }
    );
  }
}

