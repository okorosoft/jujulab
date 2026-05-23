import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DocumentStorage } from '@/lib/document-storage';
import { DocumentType } from '@/lib/models/Document';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, title, input, output, wordCount, fileName, toolMetadata } = body;

    if (!type || !title || !input || wordCount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, input, wordCount' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: DocumentType[] = [
      'humanize', 'detect', 'grammar-check', 'spell-check', 'plagiarism-check',
      'translator', 'html-to-text', 'text-to-html', 'pdf-to-html',
      'word-counter', 'character-counter', 'summarizer-text', 'summarizer-pdf',
      'summarizer-word', 'summarizer-youtube', 'summarizer-image',
      'ai-homework-helper', 'ai-math-solver', 'ask-ai',
      'ai-image-detection', 'ai-video-detection'
    ];

    if (!validTypes.includes(type as DocumentType)) {
      return NextResponse.json(
        { error: `Invalid document type: ${type}` },
        { status: 400 }
      );
    }

    // Create document
    const document = await DocumentStorage.createDocument(userId, {
      type: type as DocumentType,
      title,
      input,
      output,
      status: 'completed',
      wordCount: Number(wordCount) || 0,
      fileName,
      toolMetadata: toolMetadata || undefined,
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        type: document.type,
        title: document.title,
      },
    });
  } catch (error: any) {
    console.error('Error saving document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save document' },
      { status: 500 }
    );
  }
}

