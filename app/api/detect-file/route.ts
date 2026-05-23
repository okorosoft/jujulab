import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { APIError, handleAPIError } from '@/lib/api-error-handler';
import {
  parseAndValidateFile,
  callZeroGPTFileAPI,
  handleZeroGPTResponseError,
  parseZeroGPTFileResponse,
  parseDetectionMetrics,
  calculateDetectionProbabilities,
  buildDetectionResult,
  storeFileDetectionDocument,
  trackDetectionUsage,
  validateUserWordLimits
} from '@/lib/detection-helpers';

interface ZeroGPTFileResponse {
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

    // Parse and validate file
    const formData = await req.formData();
    const file = parseAndValidateFile(formData);

    // Call ZeroGPT file detection API
    let response: Response;
    try {
      response = await callZeroGPTFileAPI(apiKey, file);
    } catch (networkError) {
      throw new APIError(
        'Failed to connect to AI detection service. Please check your connection and try again.',
        503,
        'SERVICE_UNAVAILABLE',
        { service: 'ZeroGPT' },
        networkError instanceof Error ? networkError : undefined
      );
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      handleZeroGPTResponseError(response, errorText);
    }

    // Parse response JSON
    let result: ZeroGPTFileResponse;
    try {
      result = await response.json();
    } catch (parseError) {
      throw new APIError(
        'Invalid response from AI detection service. Please try again.',
        500,
        'INVALID_RESPONSE',
        { service: 'ZeroGPT' },
        parseError instanceof Error ? parseError : undefined
      );
    }

    // Validate ZeroGPT response
    const responseValidation = parseZeroGPTFileResponse(result);
    if (!responseValidation.valid) {
      throw new APIError(
        responseValidation.errorMessage || 'AI detection failed',
        400,
        'DETECTION_FAILED',
        { 
          service: 'ZeroGPT',
          apiCode: result.code,
          apiMessage: result.message
        }
      );
    }

    // Parse probabilities and metrics
    const fakePercentage = parseFloat(result.data.fakePercentage) || 0;
    const probabilities = calculateDetectionProbabilities(fakePercentage);
    const extractedText = result.data.input_text || '';
    const metrics = parseDetectionMetrics(result.data, extractedText);

    // Validate word count with user limits
    const validation = await validateUserWordLimits(userId, metrics.textWords);
    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.reason || 'Word limit exceeded for file processing',
          upgradeRequired: validation.upgradeRequired
        },
        { status: 403 }
      );
    }

    // Build detection result
    const detectionResult = buildDetectionResult(
      result.data,
      file,
      metrics,
      probabilities
    );

    // Store document and track usage (non-critical operations)
    await storeFileDetectionDocument(
      userId,
      extractedText,
      detectionResult.fileName,
      metrics.textWords,
      probabilities.aiProbability,
      probabilities.humanProbability,
      probabilities.confidence
    );
    await trackDetectionUsage(userId, metrics.textWords);

    return NextResponse.json(detectionResult);

  } catch (error) {
    return handleAPIError(error, 'File AI Detection');
  }
}
