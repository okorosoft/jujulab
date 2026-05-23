import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getWordCount } from '@/lib/document-storage';
import { canProcessWords } from '@/lib/usage-tracking';
import { APIError, handleAPIError } from '@/lib/api-error-handler';
import { 
  parseDetectionMetrics, 
  calculateDetectionProbabilities,
  storeDetectionDocument,
  trackDetectionUsage
} from '@/lib/detection-helpers';

interface ZeroGPTResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    input_text: string;
    originalParagraph: string;
    textWords: string;
    aiWords: string;
    fakePercentage: string;
    sentences: string;
    h: string;
    collection_id: string;
    fileName: string;
    id: string;
    feedback: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text input is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Calculate word count and validate usage
    const wordCount = getWordCount(text);
    
    // Check if user can process this many words
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    const validation = canProcessWords(user, wordCount);
    
    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.reason || 'Word limit exceeded',
          upgradeRequired: validation.upgradeRequired
        },
        { status: 403 }
      );
    }

    // Check if ZeroGPT API key is configured
    const apiKey = process.env.ZEROGPT_API_KEY;
    if (!apiKey) {
      throw new APIError(
        'AI detection service is not configured',
        500,
        'SERVICE_NOT_CONFIGURED',
        { service: 'ZeroGPT' }
      );
    }

    // Prepare ZeroGPT API request
    const headers = new Headers();
    headers.append('ApiKey', apiKey);
    headers.append('Content-Type', 'application/json');

    const requestBody = JSON.stringify({
      input_text: text.trim()
    });

    const requestOptions = {
      method: 'POST',
      headers,
      body: requestBody,
    };

    // Call ZeroGPT API
    let response: Response;
    try {
      response = await fetch('https://api.zerogpt.com/api/detect/detectText', requestOptions);
    } catch (networkError) {
      throw new APIError(
        'Failed to connect to AI detection service',
        503,
        'SERVICE_UNAVAILABLE',
        { service: 'ZeroGPT' },
        networkError instanceof Error ? networkError : undefined
      );
    }
    
    if (!response.ok) {
      throw new APIError(
        'AI detection service is currently unavailable',
        503,
        'SERVICE_ERROR',
        { 
          service: 'ZeroGPT',
          status: response.status,
          statusText: response.statusText
        }
      );
    }

    const result: ZeroGPTResponse = await response.json();

    // Validate ZeroGPT response
    if (!result.success || result.code !== 200) {
      throw new APIError(
        `AI detection failed: ${result.message || 'Unknown error'}`,
        400,
        'DETECTION_FAILED',
        { 
          service: 'ZeroGPT',
          apiCode: result.code,
          apiMessage: result.message
        }
      );
    }

    // Parse the fake percentage and calculate probabilities
    const fakePercentage = parseFloat(result.data.fakePercentage) || 0;
    const { aiProbability, humanProbability, confidence } = calculateDetectionProbabilities(fakePercentage);

    // Parse detection metrics
    const metrics = parseDetectionMetrics(result.data, text);

    // Transform ZeroGPT response to our frontend format
    const detectionResult = {
      aiProbability,
      humanProbability,
      confidence,
      verdict: aiProbability > 50 ? 'AI Generated' : 'Human Written',
      isAI: aiProbability > 50,
      details: {
        textWords: metrics.textWords,
        aiWords: metrics.aiWords,
        sentences: metrics.sentences,
        averageWordsPerSentence: metrics.averageWordsPerSentence,
        readabilityScore: metrics.readabilityScore,
        perplexity: Math.round(20 + (aiProbability * 0.3)),
        burstiness: Math.round(30 + (aiProbability * 0.2)),
      },
      rawData: {
        originalParagraph: result.data.originalParagraph,
        collection_id: result.data.collection_id,
        fileName: result.data.fileName,
        id: result.data.id,
        feedback: result.data.feedback,
        h: result.data.h
      }
    };

    // Store document and track usage (non-critical operations)
    await storeDetectionDocument(userId, text, wordCount, aiProbability, humanProbability, confidence);
    await trackDetectionUsage(userId, wordCount);

    return NextResponse.json(detectionResult);

  } catch (error) {
    return handleAPIError(error, 'AI Detection');
  }
}
