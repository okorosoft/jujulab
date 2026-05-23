"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import { 
  Upload, 
  X, 
  Loader2,
  AlertTriangle,
  CheckCircle,
  Video as VideoIcon,
  Zap,
  Eye,
  RefreshCw
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { trackToolUsage } from '@/lib/tool-usage-tracker';
import { saveDocument } from '@/lib/save-document';

interface VideoDetectionResult {
  id: string;
  status: 'pending' | 'done' | 'error';
  result?: number;
  latency_sec?: number;
  preview_url?: string | null;
  result_details?: {
    final_stage?: string;
    metadata?: {
      status: string;
      prediction: string;
      confidence: number;
    };
    watermark?: {
      prediction: string;
      confidence: number;
    };
    ml?: {
      aggregate?: {
        prob_fake: number;
        label: string;
        n_frames: number;
        latency_sec: number;
      };
    };
  };
}

export default function AIVideoDetectionPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<VideoDetectionResult | null>(null);
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
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    const validExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      setError('Invalid file type. Please upload MP4, MOV, AVI, WebM, or MKV files only.');
      return;
    }

    // Check file size (10MB limit for videos)
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
        const response = await fetch('/api/video-detection/query', {
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

        const result: VideoDetectionResult = await response.json();

        if (result.status === 'done') {
          shouldContinuePolling = false;
          setIsDetecting(false);
          setDetectionResult(result);
          
          // Track tool usage
          trackToolUsage('ai-video-detection', 'AI Video Detection', 0);
          
          // Save document
          const isAIGenerated = result.result === 1;
          const resultText = isAIGenerated ? 'AI Generated' : 'Human Written';
          const confidence = result.result_details?.ml?.aggregate?.prob_fake 
            ? Math.round(result.result_details.ml.aggregate.prob_fake * 100) 
            : 0;
          
          await saveDocument({
            type: 'ai-video-detection',
            title: `Video Detection - ${new Date().toLocaleDateString()}`,
            input: selectedFile?.name || 'Video',
            output: `Result: ${resultText}\nConfidence: ${confidence}%\n${result.result_details?.final_stage || ''}`,
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
      currentInterval = setInterval(poll, 3000); // Poll every 3 seconds for videos
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
      // Prepare form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', 'Video');

      // Submit video for detection
      const detectResponse = await fetch('/api/video-detection/detect-file', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!detectResponse.ok) {
        const errorData = await detectResponse.json();
        throw new Error(errorData.error || 'Failed to submit video for detection');
      }

      const detectData: VideoDetectionResult = await detectResponse.json();
      setIsUploading(false);

      if (detectData.status === 'done') {
        // Detection completed immediately
        setIsDetecting(false);
        setDetectionResult(detectData);
        
        // Track tool usage
        trackToolUsage('ai-video-detection', 'AI Video Detection', 0);
        
        // Save document
        const isAIGenerated = detectData.result === 1;
        const resultText = isAIGenerated ? 'AI Generated' : 'Human Written';
        const confidence = detectData.result_details?.ml?.aggregate?.prob_fake 
          ? Math.round(detectData.result_details.ml.aggregate.prob_fake * 100) 
          : 0;
        
        await saveDocument({
          type: 'ai-video-detection',
          title: `Video Detection - ${new Date().toLocaleDateString()}`,
          input: selectedFile?.name || 'Video',
          output: `Result: ${resultText}\nConfidence: ${confidence}%\n${detectData.result_details?.final_stage || ''}`,
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
      setError(error instanceof Error ? error.message : 'Failed to detect video. Please try again.');
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

  // Determine if AI generated based on result_details
  const isAIGenerated = detectionResult?.result_details?.watermark?.prediction?.includes('ai_generated') || 
                       (detectionResult?.result_details?.ml?.aggregate?.prob_fake ?? 0) > 0.5 ||
                       (detectionResult?.result && detectionResult.result > 0.5);
  
  const confidence = detectionResult?.result_details?.ml?.aggregate?.prob_fake 
    ? (detectionResult.result_details.ml.aggregate.prob_fake * 100)
    : detectionResult?.result 
    ? (detectionResult.result * 100)
    : 0;

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />

      {/* Main Content */}
      <div className="lg:pl-64 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              AI Video Detection
            </h1>
            <p className="text-gray-400">
              Upload a video to detect if it was generated by AI or created by humans.
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
                  <VideoIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Upload Video</h2>
                  <p className="text-sm text-gray-400">Select a video to analyze</p>
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
                      accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={isUploading || isDetecting}
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-white font-medium mb-2">Click to upload a video</p>
                      <p className="text-sm text-gray-400">
                        Supported formats: MP4, MOV, AVI, WebM, MKV
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Max size: 10MB | Min size: 1KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative w-full h-64 bg-white/5 rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm flex items-center justify-center">
                      {previewUrl && (
                        <video
                          src={previewUrl}
                          className="max-w-full max-h-full"
                          controls
                        />
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <VideoIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
                        {isAIGenerated ? 'AI Generated' : 'Human Created'}
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
                          {detectionResult.result_details.final_stage && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Final Stage:</span>
                              <span className="font-medium text-white capitalize">{detectionResult.result_details.final_stage}</span>
                            </div>
                          )}

                          {detectionResult.result_details.ml?.aggregate && (
                            <div className="pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">ML Model Result:</span>
                                <span className="font-medium text-white capitalize">{detectionResult.result_details.ml.aggregate.label}</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2 backdrop-blur-sm">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-1000 ${
                                    isAIGenerated ? 'bg-red-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${(detectionResult.result_details.ml.aggregate.prob_fake * 100)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                                <span>Frames analyzed: {detectionResult.result_details.ml.aggregate.n_frames}</span>
                                <span>Latency: {detectionResult.result_details.ml.aggregate.latency_sec.toFixed(2)}s</span>
                              </div>
                            </div>
                          )}

                          {detectionResult.result_details.watermark && (
                            <div className="pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">Watermark Detection:</span>
                                <span className="font-medium text-white capitalize">{detectionResult.result_details.watermark.prediction}</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2 backdrop-blur-sm">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${(detectionResult.result_details.watermark.confidence * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {detectionResult.result_details.metadata && (
                            <div className="pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">Metadata Status:</span>
                                <span className={`font-medium ${detectionResult.result_details.metadata.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {detectionResult.result_details.metadata.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Prediction:</span>
                                <span className="font-medium text-white capitalize">{detectionResult.result_details.metadata.prediction}</span>
                              </div>
                            </div>
                          )}

                          {detectionResult.latency_sec && (
                            <div className="pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Total Processing Time:</span>
                                <span className="font-medium text-white">{detectionResult.latency_sec.toFixed(2)}s</span>
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
                      Analyze Another Video
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

