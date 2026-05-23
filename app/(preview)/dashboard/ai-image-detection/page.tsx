"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Upload, 
  X, 
  Loader2,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  Zap,
  Eye,
  RefreshCw
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { trackToolUsage } from '@/lib/tool-usage-tracker';
import { saveDocument } from '@/lib/save-document';

interface DetectionResult {
  id: string;
  status: 'pending' | 'done' | 'error';
  result?: number;
  confidence?: number;
  result_details?: {
    is_valid: boolean;
    detection_step: number;
    final_result: string;
    metadata: string[];
    ocr: [string, number];
    ml_model: [string, number];
  };
  preview_url?: string;
}

export default function AIImageDetectionPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/';
    }
  }, [isLoaded, isSignedIn]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'image/heic', 'image/heif', 'image/avif', 'image/bmp', 'image/tiff', 'image/tif'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.jfif', '.heic', '.heif', '.avif', '.bmp', '.tiff', '.tif'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      setError('Invalid file type. Please upload JPG, JPEG, PNG, WebP, JFIF, HEIC, HEIF, AVIF, BMP, or TIFF files only.');
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 10MB.');
      return;
    }

    if (file.size < 1024) {
      setError('File size too small. Minimum size is 1KB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setDetectionResult(null);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectionResult(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const pollDetectionStatus = async (detectionId: string) => {
    // Clear any existing polling interval first
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    let currentInterval: NodeJS.Timeout | null = null;
    let shouldContinuePolling = true;

    const poll = async () => {
      if (!shouldContinuePolling) {
        return;
      }

      try {
        const response = await fetch('/api/image-detection/query', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: detectionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to query detection status');
        }

        const result: DetectionResult = await response.json();

        if (result.status === 'done') {
          shouldContinuePolling = false;
          setIsDetecting(false);
          setDetectionResult(result);
          
          // Track tool usage
          trackToolUsage('ai-image-detection', 'AI Image Detection', 0);
          
          // Save document
          const isAIGenerated = result.result === 1;
          const resultText = isAIGenerated ? 'AI Generated' : 'Human Written';
          const confidence = result.confidence || result.result_details?.ml_model?.[1] || 0;
          
          await saveDocument({
            type: 'ai-image-detection',
            title: `Image Detection - ${new Date().toLocaleDateString()}`,
            input: selectedFile?.name || 'Image',
            output: `Result: ${resultText}\nConfidence: ${confidence}%\n${result.result_details?.final_result || ''}`,
            wordCount: 0,
            fileName: selectedFile?.name,
            toolMetadata: {
              isAIGenerated,
              confidence,
              result: result.result,
              resultDetails: result.result_details,
            },
          });
          
          if (currentInterval) {
            clearInterval(currentInterval);
            setPollingInterval(null);
          }
        } else if (result.status === 'error') {
          shouldContinuePolling = false;
          setIsDetecting(false);
          setError('Detection failed. Please try again.');
          if (currentInterval) {
            clearInterval(currentInterval);
            setPollingInterval(null);
          }
        }
        // If status is 'pending', continue polling
      } catch (error) {
        console.error('Error polling detection status:', error);
        shouldContinuePolling = false;
        setIsDetecting(false);
        setError('Failed to check detection status. Please try again.');
        if (currentInterval) {
          clearInterval(currentInterval);
          setPollingInterval(null);
        }
      }
    };

    // Poll immediately
    await poll();
    
    // Only start interval if we should continue polling
    if (shouldContinuePolling) {
      currentInterval = setInterval(poll, 2000);
      setPollingInterval(currentInterval);
    }
  };

  const handleDetect = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setIsDetecting(true);
    setError(null);
    setDetectionResult(null);

    try {
      // Step 1: Get presigned URL with content_type to minimize expiration risk
      const sanitizedFileName = selectedFile.name.replace(/\s+/g, '');
      const contentType = selectedFile.type || `image/${selectedFile.name.split('.').pop()?.toLowerCase()}`;

      const presignedUrlResponse = await fetch(
        `/api/image-detection/presigned-url?file_name=${encodeURIComponent(sanitizedFileName)}&content_type=${encodeURIComponent(contentType)}`,
        {
          credentials: 'include',
        }
      );

      if (!presignedUrlResponse.ok) {
        let errorMessage = 'Failed to get presigned URL';
        try {
          const errorData = await presignedUrlResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${presignedUrlResponse.status}: ${presignedUrlResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const presignedData = await presignedUrlResponse.json();
      console.log('Presigned URL response:', presignedData);
      
      // Handle different response formats (presignedUrl vs presigned_url)
      const presignedUrl = presignedData.presignedUrl || presignedData.presigned_url;
      const fileKey = presignedData.fileKey || presignedData.file_key || presignedData.file_path;

      if (!presignedUrl) {
        throw new Error('Presigned URL not found in API response');
      }

      if (!fileKey) {
        throw new Error('File key not found in API response');
      }

      // Ensure presigned URL is absolute
      if (!presignedUrl.startsWith('http://') && !presignedUrl.startsWith('https://')) {
        throw new Error(`Invalid presigned URL format: ${presignedUrl}`);
      }

      // Step 2: Upload image directly to presigned URL using PUT (as per API docs)
      // Try direct upload first, fallback to server-side upload if CORS fails
      let uploadResponse: Response;
      try {
        uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
          },
          body: selectedFile,
        });

        // If direct upload fails, try server-side upload as fallback
        if (!uploadResponse.ok) {
          console.warn('Direct upload failed, trying server-side upload...');
          
          // Convert file to base64 for server-side upload
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.includes(',') ? result.split(',')[1] : result;
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });

          uploadResponse = await fetch('/api/image-detection/upload', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              presignedUrl: presignedUrl,
              fileData: base64Data,
              contentType,
            }),
          });
        }
      } catch (uploadError) {
        console.error('Direct upload error:', uploadError);
        // Fallback to server-side upload
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        uploadResponse = await fetch('/api/image-detection/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            presignedUrl: presignedUrl,
          fileData: base64Data,
          contentType,
        }),
      });
      }

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload error:', errorText);
        throw new Error(`Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      setIsUploading(false);

      // Step 3: Submit image for detection using fileKey
      const detectResponse = await fetch('/api/image-detection/detect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey: fileKey,
          generate_preview: true,
        }),
      });

      if (!detectResponse.ok) {
        const errorData = await detectResponse.json();
        throw new Error(errorData.error || 'Failed to submit image for detection');
      }

      const detectData: DetectionResult = await detectResponse.json();

      if (detectData.status === 'done') {
        // Detection completed immediately
        setIsDetecting(false);
        setDetectionResult(detectData);
        
        // Track tool usage
        trackToolUsage('ai-image-detection', 'AI Image Detection', 0);
        
        // Save document
        const isAIGenerated = detectData.result === 1;
        const resultText = isAIGenerated ? 'AI Generated' : 'Human Written';
        const confidence = detectData.confidence || detectData.result_details?.ml_model?.[1] || 0;
        
        await saveDocument({
          type: 'ai-image-detection',
          title: `Image Detection - ${new Date().toLocaleDateString()}`,
          input: selectedFile?.name || 'Image',
          output: `Result: ${resultText}\nConfidence: ${confidence}%\n${detectData.result_details?.final_result || ''}`,
          wordCount: 0,
          fileName: selectedFile?.name,
          toolMetadata: {
            isAIGenerated,
            confidence,
            result: detectData.result,
            resultDetails: detectData.result_details,
          },
        });
      } else {
        // Start polling for results
        await pollDetectionStatus(detectData.id);
      }
    } catch (error) {
      console.error('Detection error:', error);
      setIsUploading(false);
      setIsDetecting(false);
      setError(error instanceof Error ? error.message : 'Failed to detect image. Please try again.');
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <>
        <DashboardSidebar />
        <SkeletonPage type="ai-detector" />
      </>
    );
  }

  const isAIGenerated = detectionResult?.result_details?.final_result === 'AI Generated';
  const confidence = detectionResult?.confidence || detectionResult?.result || 0;

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />

      {/* Main Content */}
      <div className="lg:pl-64 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              AI Image Detection
            </h1>
            <p className="text-gray-400">
              Upload an image to detect if it was generated by AI or created by humans.
            </p>
          </div>

          {/* Main Interface */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16"
          >
            {/* Upload Panel */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-lg border border-white/10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Upload Image</h2>
                  <p className="text-sm text-gray-400">Select an image to analyze</p>
                </div>
              </div>

              <div className="space-y-4">
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all duration-300 backdrop-blur-sm"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif,image/heic,image/heif,image/avif,image/bmp,image/tiff,image/tif"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={isUploading || isDetecting}
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-white font-medium mb-2">Click to upload an image</p>
                      <p className="text-sm text-gray-400">
                        Supported formats: JPG, PNG, WebP, HEIC, AVIF, BMP, TIFF
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Max size: 10MB | Min size: 1KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative w-full h-64 bg-white/5 rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm">
                      {previewUrl && (
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <ImageIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                          <p className="text-xs text-gray-400">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleFileRemove}
                        disabled={isUploading || isDetecting}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleDetect}
                  disabled={!selectedFile || isUploading || isDetecting}
                  className="w-full flex items-center justify-center space-x-2 px-8 py-3 bg-white hover:bg-gray-100 text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : isDetecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Detect AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-lg border border-white/10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Detection Results</h2>
                  <p className="text-sm text-gray-400">AI detection analysis</p>
                </div>
              </div>

              <div className="space-y-6">
                {detectionResult && detectionResult.status === 'done' ? (
                  <>
                    {/* Main Result */}
                    <div className="text-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border ${
                        isAIGenerated ? 'bg-red-500/20 border-red-500/30' : 'bg-emerald-500/20 border-emerald-500/30'
                      }`}>
                        {isAIGenerated ? (
                          <AlertTriangle className="w-10 h-10 text-red-400" />
                        ) : (
                          <CheckCircle className="w-10 h-10 text-emerald-400" />
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {detectionResult.result_details?.final_result || 'Analysis Complete'}
                      </h3>
                      <div className="text-4xl font-bold mb-2">
                        <span className={isAIGenerated ? 'text-red-400' : 'text-emerald-400'}>
                          {confidence.toFixed(2)}%
                        </span>
                        <span className="text-gray-400"> Confidence</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {isAIGenerated ? 'Likely AI Generated' : 'Likely Human Created'}
                      </p>
                    </div>

                    {/* Detailed Results */}
                    {detectionResult.result_details && (
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 space-y-4">
                        <h4 className="font-semibold text-white mb-3">Detailed Analysis</h4>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Detection Step:</span>
                            <span className="font-medium text-white">{detectionResult.result_details.detection_step}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Is Valid:</span>
                            <span className={`font-medium ${detectionResult.result_details.is_valid ? 'text-emerald-400' : 'text-red-400'}`}>
                              {detectionResult.result_details.is_valid ? 'Yes' : 'No'}
                            </span>
                          </div>
                          
                          {detectionResult.result_details.ml_model && (
                            <div className="pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">ML Model Result:</span>
                                <span className="font-medium text-white">{detectionResult.result_details.ml_model[0]}</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2 backdrop-blur-sm">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-1000 ${
                                    isAIGenerated ? 'bg-red-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${detectionResult.result_details.ml_model[1]}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {detectionResult.result_details.ocr && (
                            <div className="pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">OCR Result:</span>
                                <span className="font-medium text-white">{detectionResult.result_details.ocr[0]}</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2 backdrop-blur-sm">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${detectionResult.result_details.ocr[1]}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Preview URL */}
                    {detectionResult.preview_url && (
                      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                        <a
                          href={detectionResult.preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">View Preview</span>
                        </a>
                      </div>
                    )}

                    <button
                      onClick={handleFileRemove}
                      className="w-full px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm border border-white/20"
                    >
                      Analyze Another Image
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                        <Eye className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 font-medium">
                        {isDetecting ? 'Detection in progress...' : 'Detection results will appear here'}
                      </p>
                      {isDetecting && (
                        <div className="mt-4 flex items-center justify-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span className="text-sm text-gray-400">This may take a few moments</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

