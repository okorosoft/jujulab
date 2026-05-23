/**
 * Helper functions for AI detection routes
 */

import { clerkClient } from '@clerk/nextjs/server';
import { DocumentStorage, generateDocumentTitle } from '@/lib/document-storage';
import { getCurrentUsage, canProcessWords } from '@/lib/usage-tracking';
import { APIError } from '@/lib/api-error-handler';

interface ZeroGPTResponseData {
  textWords: string;
  aiWords: string;
  sentences: string;
  fakePercentage: string;
  originalParagraph: string;
  collection_id: string;
  fileName: string;
  id: string;
  feedback: string;
  h: string;
  input_text?: string;
}

interface DetectionMetrics {
  textWords: number;
  aiWords: number;
  sentences: number;
  averageWordsPerSentence: number;
  readabilityScore: number;
}

/**
 * Parse metrics from ZeroGPT response
 */
export function parseDetectionMetrics(
  resultData: ZeroGPTResponseData,
  fallbackText?: string
): DetectionMetrics {
  let textWords = parseInt(resultData.textWords?.toString() || '0', 10) || 0;
  let aiWords = parseInt(resultData.aiWords?.toString() || '0', 10) || 0;
  let sentences = parseInt(resultData.sentences?.toString() || '0', 10) || 0;
  
  // Fallback: Calculate basic metrics from input text if ZeroGPT doesn't provide them
  const fakePercentage = parseFloat(resultData.fakePercentage) || 0;
  const aiProbability = Math.round(fakePercentage);
  
  if ((textWords === 0 || sentences === 0) && fallbackText) {
    const words = fallbackText.trim().split(/\s+/).filter(word => word.length > 0);
    const sentenceCount = fallbackText.trim().split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    textWords = words.length;
    sentences = sentenceCount;
    aiWords = Math.round(textWords * (aiProbability / 100));
  }

  const averageWordsPerSentence = sentences > 0 ? Math.round(textWords / sentences) : 0;
  const readabilityScore = Math.max(0, Math.min(100, 100 - (aiProbability * 0.8)));

  return {
    textWords,
    aiWords,
    sentences,
    averageWordsPerSentence,
    readabilityScore
  };
}

/**
 * Calculate detection probabilities and confidence
 */
export function calculateDetectionProbabilities(fakePercentage: number): {
  aiProbability: number;
  humanProbability: number;
  confidence: number;
} {
  const aiProbability = Math.round(fakePercentage);
  const humanProbability = 100 - aiProbability;
  const confidence = Math.min(95, Math.max(70, 100 - Math.abs(50 - aiProbability)));

  return {
    aiProbability,
    humanProbability,
    confidence
  };
}

/**
 * Store detection document (non-critical, errors are silently handled)
 */
export async function storeDetectionDocument(
  userId: string,
  text: string,
  wordCount: number,
  aiProbability: number,
  humanProbability: number,
  confidence: number,
  fileName?: string
): Promise<void> {
  try {
    await DocumentStorage.createDocument(userId, {
      type: 'detect',
      title: generateDocumentTitle('detect', text),
      input: text,
      status: 'completed',
      wordCount,
      aiProbability,
      humanProbability,
      confidence,
      fileName
    });
  } catch (error) {
    // Don't fail the request if storage fails
    // Error is silently handled as document storage is non-critical
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Failed to store detection document (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
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
    return {
      valid: false,
      error: 'Invalid file type. Please upload TXT, PDF, or DOCX files only.'
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.'
    };
  }

  return { valid: true };
}

/**
 * Call ZeroGPT file detection API
 */
export async function callZeroGPTFileAPI(
  apiKey: string,
  file: File
): Promise<Response> {
  const headers = new Headers();
  headers.append('ApiKey', apiKey);

  const formDataForAPI = new FormData();
  formDataForAPI.append('file', file, file.name);

  const requestOptions = {
    method: 'POST',
    headers,
    body: formDataForAPI,
  };

  const response = await fetch('https://api.zerogpt.com/api/detect/detectFile', requestOptions);
  return response;
}

/**
 * Handle HTTP response errors from ZeroGPT API
 */
export function handleZeroGPTResponseError(response: Response, errorText: string): never {
  let errorMessage = 'AI detection service is currently unavailable';
  let statusCode = 503;
  let errorCode = 'SERVICE_ERROR';
  
  if (response.status === 413) {
    errorMessage = 'File is too large for analysis. Please upload a smaller file (max 10MB).';
    statusCode = 413;
    errorCode = 'FILE_TOO_LARGE';
  } else if (response.status === 400) {
    errorMessage = 'Invalid file format. Please ensure your file is a valid PDF, DOCX, or TXT file.';
    statusCode = 400;
    errorCode = 'INVALID_FILE_FORMAT';
  } else if (response.status === 429) {
    errorMessage = 'Too many requests. Please try again in a few moments.';
    statusCode = 429;
    errorCode = 'RATE_LIMITED';
  }
  
  throw new APIError(
    errorMessage,
    statusCode,
    errorCode,
    { 
      service: 'ZeroGPT',
      status: response.status,
      statusText: response.statusText,
      errorText
    }
  );
}

/**
 * Parse file from form data and validate
 */
export function parseAndValidateFile(formData: FormData): File {
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new APIError(
      'No file provided',
      400,
      'NO_FILE_PROVIDED'
    );
  }
  
  const fileValidation = validateFile(file);
  if (!fileValidation.valid) {
    throw new APIError(
      fileValidation.error || 'Invalid file',
      400,
      'INVALID_FILE',
      { fileName: file.name, fileSize: file.size }
    );
  }
  
  return file;
}

/**
 * Validate user word limits for file processing
 */
export async function validateUserWordLimits(
  userId: string,
  wordCount: number
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: string }> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const validation = canProcessWords(user, wordCount);
  
  return validation;
}

/**
 * Parse and validate ZeroGPT file response
 */
export function parseZeroGPTFileResponse(
  result: { success: boolean; code: number; message: string }
): { valid: boolean; errorMessage?: string } {
  if (!result.success || result.code !== 200) {
    let errorMessage = 'AI detection failed';
    if (result.message) {
      if (result.message.includes('Page')) {
        errorMessage = 'This document is too complex for analysis. Please try a simpler document or extract specific sections.';
      } else if (result.message.includes('timeout') || result.message.includes('time out')) {
        errorMessage = 'Analysis timed out. The file may be too large or complex. Please try a smaller file.';
      } else if (result.message.includes('format') || result.message.includes('invalid')) {
        errorMessage = 'Invalid file format. Please ensure your file is properly formatted.';
      } else {
        errorMessage = `AI detection failed: ${result.message}`;
      }
    }
    return { valid: false, errorMessage };
  }
  return { valid: true };
}

/**
 * Build detection result object
 */
export function buildDetectionResult(
  resultData: ZeroGPTResponseData,
  file: File,
  metrics: DetectionMetrics,
  probabilities: { aiProbability: number; humanProbability: number; confidence: number }
) {
  const fileName = resultData.fileName || file.name;
  return {
    aiProbability: probabilities.aiProbability,
    humanProbability: probabilities.humanProbability,
    confidence: probabilities.confidence,
    verdict: probabilities.aiProbability > 50 ? 'AI Generated' : 'Human Written',
    isAI: probabilities.aiProbability > 50,
    fileName,
    details: {
      textWords: metrics.textWords,
      aiWords: metrics.aiWords,
      sentences: metrics.sentences,
      averageWordsPerSentence: metrics.averageWordsPerSentence,
      readabilityScore: metrics.readabilityScore,
      perplexity: Math.round(20 + (probabilities.aiProbability * 0.3)),
      burstiness: Math.round(30 + (probabilities.aiProbability * 0.2)),
    },
    rawData: {
      originalParagraph: resultData.originalParagraph,
      collection_id: resultData.collection_id,
      fileName: resultData.fileName,
      id: resultData.id,
      feedback: resultData.feedback,
      h: resultData.h,
      input_text: resultData.input_text
    }
  };
}

/**
 * Store file detection document (non-critical, errors are silently handled)
 */
export async function storeFileDetectionDocument(
  userId: string,
  extractedText: string,
  fileName: string,
  wordCount: number,
  aiProbability: number,
  humanProbability: number,
  confidence: number
): Promise<void> {
  try {
    await DocumentStorage.createDocument(userId, {
      type: 'detect',
      title: generateDocumentTitle('detect', extractedText || fileName),
      input: extractedText || fileName,
      status: 'completed',
      wordCount,
      aiProbability,
      humanProbability,
      confidence,
      fileName
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Failed to store detection document (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Track usage after successful detection (non-critical, errors are silently handled)
 */
export async function trackDetectionUsage(
  userId: string,
  wordCount: number
): Promise<void> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const currentUsage = getCurrentUsage(user);
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        totalWords: (currentUsage.totalWords || 0) + wordCount,
        detectorWords: (currentUsage.detectorWords || 0) + wordCount,
        monthlyUsage: {
          ...currentUsage.monthlyUsage,
          [currentMonth]: (currentUsage.monthlyUsage[currentMonth] || 0) + wordCount
        }
      }
    });
  } catch (error) {
    // Log but don't fail the request if usage tracking fails
    // Error is silently handled as usage tracking is non-critical
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Failed to track usage (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
