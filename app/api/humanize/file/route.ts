import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getWordCount } from '@/lib/document-storage';
import { canProcessWords, getCurrentUsage } from '@/lib/usage-tracking';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    const allowedExtensions = ['.txt', '.pdf', '.docx', '.doc'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload TXT, PDF, or DOCX files only.' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Read file content and extract text first (to get actual word count)
    let extractedText = '';
    
    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        extractedText = await file.text();
      } else {
        // For PDF/DOCX, we would need to use libraries like pdf-parse or mammoth
        // For now, we'll return an error asking user to provide text directly
        return NextResponse.json(
          { error: 'Please extract text from your PDF or DOCX file and paste it directly. Full file parsing support coming soon.' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to read file content' },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { error: 'File must contain at least 50 characters of text' },
        { status: 400 }
      );
    }

    // Calculate actual word count from extracted text
    const actualWordCount = getWordCount(extractedText);

    // Now validate with ACTUAL word count
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    const validation = canProcessWords(user, actualWordCount);
    
    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.reason || 'Word limit exceeded',
          upgradeRequired: validation.upgradeRequired
        },
        { status: 403 }
      );
    }

    // Return extracted text for processing
    return NextResponse.json({
      success: true,
      text: extractedText,
      wordCount: actualWordCount,
      fileName: file.name
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    );
  }
}
