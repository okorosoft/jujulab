import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to check and deduct credits
async function checkAndDeductCredits(userId: string, toolId: string, charactersUsed: number): Promise<{ success: boolean; error?: string; remainingCredits?: number }> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    const toolCredits = (user.publicMetadata?.toolCredits as Record<string, number>) || {};
    const currentCredits = toolCredits[toolId] || 0;
    
    if (currentCredits < charactersUsed) {
      return {
        success: false,
        error: `Insufficient credits. You have ${currentCredits.toLocaleString()} characters, but need ${charactersUsed.toLocaleString()}.`,
      };
    }
    
    // Deduct credits
    toolCredits[toolId] = currentCredits - charactersUsed;
    
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
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Word file is required' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.includes('word') && !file.type.includes('document')) {
      return NextResponse.json(
        { error: 'Only Word documents (.doc, .docx) are supported' },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Estimate characters: Word files typically have ~500-1000 chars per KB
    // Using conservative estimate of 500 chars per KB
    const estimatedCharacters = Math.ceil(file.size / 1024 * 500);
    
    // Check and deduct credits before processing
    const creditCheck = await checkAndDeductCredits(userId, 'summarizer', estimatedCharacters);
    if (!creditCheck.success) {
      return NextResponse.json(
        { error: creditCheck.error },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64String = buffer.toString('base64');
    
    // Determine MIME type based on file extension
    const mimeType = file.name.toLowerCase().endsWith('.docx') 
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/msword';

    // Send Word document directly to GPT-4o using base64 encoding
    try {
      // Try using the responses.create API if available (newer OpenAI API)
      const response = await (openai as any).responses?.create({
        model: 'gpt-4o',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                filename: file.name,
                file_data: `data:${mimeType};base64,${base64String}`,
              },
              {
                type: 'input_text',
                text: 'Please provide a comprehensive summary of this Word document. Include:\n1. A brief overview of the document\'s main topic and purpose\n2. Key points and important information in bullet form\n3. Main conclusions, findings, or recommendations',
              },
            ],
          },
        ],
      });

      const summary = response?.output_text || 'Summary could not be generated';
      
      // Extract key points from the summary
      const keyPointsMatch = summary.match(/(?:Key points|Key Points|Bullet points|Bullets?|•|\-)\:?\s*\n?(.*?)(?:\n\n|\n[A-Z]|$)/s);
      const keyPoints = keyPointsMatch
        ? keyPointsMatch[1]
            .split(/\n\s*[•\-*]\s*/)
            .filter((point: string) => point.trim().length > 0)
            .map((point: string) => point.trim())
        : [];

      const processingTime = Date.now() - startTime;

      return NextResponse.json({
        summary,
        keyPoints,
        processingTime,
        creditsUsed: estimatedCharacters,
        remainingCredits: creditCheck.remainingCredits,
      });
    } catch (responsesError: any) {
      // Fallback to Files API approach if responses.create is not available
      console.log('responses.create not available, trying Files API approach:', responsesError.message);
      
      // Step 1: Upload the Word file to OpenAI File API
      const uploadedFile = await openai.files.create({
        file: new File([buffer], file.name, { type: mimeType }),
        purpose: 'assistants',
      });

      const fileId = uploadedFile.id;

      // Step 2: Wait for file to be processed
      let fileStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;

      while (fileStatus !== 'processed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const fileInfo = await openai.files.retrieve(fileId);
        fileStatus = fileInfo.status || 'pending';
        attempts++;
      }

      if (fileStatus !== 'processed') {
        await openai.files.delete(fileId).catch(() => {});
        return NextResponse.json(
          { error: 'File processing timed out. Please try again.' },
          { status: 500 }
        );
      }

      // Step 3: Use the file in a chat completion with GPT-4o
      const assistant = await openai.beta.assistants.create({
        model: 'gpt-4o',
        instructions: `You are an expert document summarizer. Create a concise, well-structured summary of the provided Word document content. Include:
1. A brief overview of the document's main topic and purpose
2. Key points and important information in bullet form
3. Main conclusions, findings, or recommendations

Focus on extracting the most valuable and relevant information from the document. Keep the summary comprehensive but not verbose.`,
        tools: [{ type: 'file_search' }],
        tool_resources: {
          file_search: {
            vector_store_ids: [],
          },
        },
      });

      // Create a thread with the file
      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: 'Please provide a comprehensive summary of this Word document, including key points and main conclusions.',
            attachments: [
              {
                file_id: fileId,
                tools: [{ type: 'file_search' }],
              },
            ],
          },
        ],
      });

      // Run the assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
      });

      // Wait for completion
      let runStatus = run.status;
      let runAttempts = 0;
      const maxRunAttempts = 120;

      while ((runStatus === 'queued' || runStatus === 'in_progress') && runAttempts < maxRunAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const runCheck = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
        runStatus = runCheck.status;
        runAttempts++;
      }

      if (runStatus !== 'completed') {
        await openai.beta.assistants.delete(assistant.id).catch(() => {});
        await openai.beta.threads.delete(thread.id).catch(() => {});
        await openai.files.delete(fileId).catch(() => {});
        return NextResponse.json(
          { error: `Processing failed with status: ${runStatus}` },
          { status: 500 }
        );
      }

      // Get the response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(m => m.role === 'assistant');
      
      if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== 'text') {
        await openai.beta.assistants.delete(assistant.id).catch(() => {});
        await openai.beta.threads.delete(thread.id).catch(() => {});
        await openai.files.delete(fileId).catch(() => {});
        return NextResponse.json(
          { error: 'No summary generated' },
          { status: 500 }
        );
      }

      const summary = assistantMessage.content[0].type === 'text' 
        ? assistantMessage.content[0].text.value 
        : 'Summary could not be generated';

      // Clean up
      await openai.beta.assistants.delete(assistant.id).catch(() => {});
      await openai.beta.threads.delete(thread.id).catch(() => {});
      await openai.files.delete(fileId).catch(() => {});

      // Extract key points from the summary
      const keyPointsMatch = summary.match(/(?:Key points|Key Points|Bullet points|Bullets?|•|\-)\:?\s*\n?(.*?)(?:\n\n|\n[A-Z]|$)/s);
      const keyPoints = keyPointsMatch
        ? keyPointsMatch[1]
            .split(/\n\s*[•\-*]\s*/)
            .filter((point: string) => point.trim().length > 0)
            .map((point: string) => point.trim())
        : [];

      const processingTime = Date.now() - startTime;

      return NextResponse.json({
        summary,
        keyPoints,
        processingTime,
      });
    }

  } catch (error) {
    console.error('Error in Word summarizer:', error);
    return NextResponse.json(
      { error: 'Failed to summarize Word document' },
      { status: 500 }
    );
  }
}
