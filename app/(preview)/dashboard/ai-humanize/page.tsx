"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Copy, 
  Download, 
  Zap, 
  Brain,
  CheckCircle,
  Loader2,
  Languages,
  ChevronDown,
  Shield,
  Upload,
  FileText,
  X,
  Eye,
  EyeOff,
  History,
  BarChart3
} from "lucide-react";
import { useUsageTracking } from "@/lib/hooks/useUsageTracking";
import UsageTracker from "@/components/usage-tracker";
import { getSubscriptionLimits } from "@/lib/subscription-utils";
import { getUserSubscription } from "@/lib/stripe";
import { SkeletonPage } from "@/components/skeleton-loader";

export default function AIHumanizePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  
  // New state for file upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  
  // New state for humanization settings
  const [readability, setReadability] = useState('High School');
  const [purpose, setPurpose] = useState('General Writing');
  const [strength, setStrength] = useState('More Human');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [documentHistory, setDocumentHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pollingTimeout, setPollingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [translationInfo, setTranslationInfo] = useState<{sourceLanguage: string, targetLanguage: string} | null>(null);
  
  // Usage tracking
  const { } = useUsageTracking();
  const [wordCount, setWordCount] = useState(0);
  const [subscriptionLimits, setSubscriptionLimits] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/';
    }
  }, [isLoaded, isSignedIn]);

  // Load subscription limits
  useEffect(() => {
    if (user) {
      const limits = getSubscriptionLimits(user);
      setSubscriptionLimits(limits);
    }
  }, [user]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
      }
    };
  }, [pollingTimeout]);

  const stopPolling = () => {
    if (pollingTimeout) {
      clearTimeout(pollingTimeout);
      setPollingTimeout(null);
    }
    setIsProcessing(false);
    setError('Processing stopped by user');
  };

  const loadDocumentHistory = async () => {
    try {
      const response = await fetch('/api/humanize/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentHistory(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading document history:', error);
    }
  };

  // Calculate word count when input changes
  useEffect(() => {
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
  }, [inputText]);

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    
    // Usage validation is handled by the UsageTracker component
    // No need for manual validation here
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Submit document to Undetectable API
      const submitResponse = await fetch('/api/humanize/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: inputText,
          readability,
          purpose,
          strength,
          model: 'v11'
        }),
      });

      if (!submitResponse.ok) {
        let errorData;
        try {
          errorData = await submitResponse.json();
        } catch (e) {
          errorData = { error: `HTTP ${submitResponse.status}: ${submitResponse.statusText}` };
        }
        
        console.error('API Error Details:', errorData);
        console.error('Response status:', submitResponse.status);
        console.error('Response headers:', Object.fromEntries(submitResponse.headers.entries()));
        
        // Extract more detailed error message
        let errorMessage = 'Failed to submit document';
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join('. ');
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (submitResponse.status === 400) {
          errorMessage = 'Bad request - please check your input parameters';
        } else if (submitResponse.status === 401) {
          errorMessage = 'Unauthorized - please check your API key';
        } else if (submitResponse.status === 403) {
          // Check if it's a word limit error
          if (errorData.error?.includes('exceed') || errorData.upgradeRequired) {
            errorMessage = errorData.error || 'Word limit exceeded. Please upgrade to process more words.';
            // Store upgrade info for display
            if (errorData.upgradeRequired) {
              errorMessage += ` Consider upgrading to ${errorData.upgradeRequired} plan.`;
            }
          } else {
            errorMessage = 'Forbidden - insufficient credits or access denied';
          }
        } else if (submitResponse.status >= 500) {
          errorMessage = 'Server error - please try again later';
        }
        
        throw new Error(errorMessage);
      }

      const submitData = await submitResponse.json();
      const documentId = submitData.documentId; // Use our internal document ID
      setCurrentDocumentId(documentId);

      // Poll for completion (check every 5 seconds, max 12 attempts = 1 minute)
      let attempts = 0;
      const maxAttempts = 12;
      
      const pollForCompletion = async () => {
        try {
          console.log(`Polling attempt ${attempts + 1}/${maxAttempts} for document ${documentId}`);
          
          const documentResponse = await fetch('/api/humanize/document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ documentId: documentId }),
          });

          if (documentResponse.ok) {
            const documentData = await documentResponse.json();
            console.log('Document response:', documentData);
            
            if (documentData.output) {
              setOutputText(documentData.output);
              setIsProcessing(false);
              
              // Usage tracking is handled by the UsageTracker component
              // No need for manual tracking here
              return;
            }
          } else {
            console.error('Document fetch failed:', documentResponse.status, await documentResponse.text());
          }

          attempts++;
          if (attempts < maxAttempts) {
            console.log(`Retrying in 5 seconds... (${attempts}/${maxAttempts})`);
            const timeoutId = setTimeout(pollForCompletion, 5000);
            setPollingTimeout(timeoutId);
          } else {
            console.error('Max polling attempts reached');
            setError('Document processing timed out after 1 minute. Please try again.');
            setIsProcessing(false);
            setPollingTimeout(null);
          }
        } catch (error) {
          console.error('Error polling for document:', error);
          setError('Failed to retrieve humanized document: ' + (error instanceof Error ? error.message : 'Unknown error'));
          setIsProcessing(false);
        }
      };

      // Start polling after a short delay
      console.log('Starting polling for document:', documentId);
      const initialTimeoutId = setTimeout(pollForCompletion, 3000);
      setPollingTimeout(initialTimeoutId);

    } catch (error) {
      console.error('Error humanizing text:', error);
      setError(error instanceof Error ? error.message : 'Failed to humanize text');
      setIsProcessing(false);
    }
  };

  const handleRehumanize = async () => {
    if (!currentDocumentId) return;
    
    // Check subscription access
    if (!subscriptionLimits?.hasRehumanization) {
      setError('Rehumanization feature requires Pro plan or higher. Please upgrade to use this feature.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/humanize/rehumanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: currentDocumentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rehumanize document');
      }

      const data = await response.json();
      const newDocumentId = data.documentId || data.id; // Handle both new and old format
      setCurrentDocumentId(newDocumentId);

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 10;
      
      const pollForCompletion = async () => {
        try {
          const documentResponse = await fetch('/api/humanize/document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ documentId: newDocumentId }),
          });

          if (documentResponse.ok) {
            const documentData = await documentResponse.json();
            if (documentData.output) {
              setOutputText(documentData.output);
              setIsProcessing(false);
              return;
            }
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, 3000);
          } else {
            throw new Error('Document processing timed out');
          }
        } catch (error) {
          console.error('Error polling for document:', error);
          setError('Failed to retrieve rehumanized document');
          setIsProcessing(false);
        }
      };

      setTimeout(pollForCompletion, 2000);

    } catch (error) {
      console.error('Error rehumanizing text:', error);
      setError(error instanceof Error ? error.message : 'Failed to rehumanize text');
      setIsProcessing(false);
    }
  };

  const handleClearTranslation = () => {
    setTranslatedText('');
    setTranslationInfo(null);
  };

  const handleCopy = async () => {
    const textToCopy = translatedText || outputText;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTranslate = async () => {
    if (!outputText) return;
    
    // Check subscription access
    if (!subscriptionLimits?.hasTranslation) {
      setError('Translation feature requires Pro plan or higher. Please upgrade to use this feature.');
      return;
    }
    
    setIsTranslating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: outputText,
          targetLanguage: selectedLanguage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to translate text');
      }

      const data = await response.json();
      setTranslatedText(data.translatedText);
      setTranslationInfo({
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage
      });
      setIsTranslating(false);
    } catch (error) {
      console.error('Translation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to translate text');
      setIsTranslating(false);
    }
  };

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi'
    };
    return languages[code] || 'English';
  };

  // File handling functions
  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    
    const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isValidFile = validTypes.includes(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.pdf') || file.name.endsWith('.docx');
    
    if (isValidFile) {
      setUploadedFile(file);
      setIsFileProcessing(true);
      setError(null);
      
      try {
        // Upload file to API for validation and text extraction
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/humanize/file', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = 'File processing failed';
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            
            // Handle word limit exceeded error
            if (response.status === 403 && errorData.error) {
              setError(errorData.error);
              setIsFileProcessing(false);
              return;
            }
          } catch (e) {
            // If response is not JSON, use default messages
            if (response.status === 413) {
              errorMessage = 'File is too large. Maximum size is 10MB.';
            } else if (response.status === 400) {
              errorMessage = 'Invalid file format or empty file.';
            }
          }
          
          setError(errorMessage);
          setIsFileProcessing(false);
          return;
        }

        const data = await response.json();
        
        if (data.success && data.text) {
          setInputText(data.text);
          setWordCount(data.wordCount || 0);
        } else {
          setError('Failed to extract text from file');
        }
      } catch (error) {
        console.error('File upload error:', error);
        setError('Failed to process file. Please try again.');
      } finally {
        setIsFileProcessing(false);
      }
    } else {
      setError('Invalid file type. Please upload TXT, PDF, or DOCX files only.');
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setInputText('');
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <>
        <DashboardSidebar />
        <SkeletonPage type="ai-humanize" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />

      {/* Main Content */}
      <div className="lg:pl-64 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              AI Humanize
            </h1>
            <p className="text-gray-400">
              Transform AI-generated content into natural, human-like text.
            </p>
          </div>


          {/* Main Interface */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16"
          >
            {/* Input Panel */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-lg border border-white/10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Input Text</h2>
                  <p className="text-sm text-gray-400">Paste your AI-generated content</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* File Upload Section */}
                {!uploadedFile ? (
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Upload a file (PDF, DOCX, TXT)</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload-input"
                    />
                    <label
                      htmlFor="file-upload-input"
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors backdrop-blur-sm"
                    >
                      Choose File
                    </label>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{uploadedFile.name}</p>
                          <p className="text-xs text-gray-400">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                          className="hidden"
                          id="file-upload-change"
                        />
                        <label
                          htmlFor="file-upload-change"
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium text-white cursor-pointer transition-colors backdrop-blur-sm"
                        >
                          Change
                        </label>
                        <button
                          onClick={removeUploadedFile}
                          className="p-1.5 hover:bg-white/10 rounded-md transition-colors backdrop-blur-sm"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    {isFileProcessing && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span className="text-sm text-gray-300">Processing file...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Humanization Settings */}
                <div className="space-y-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-3">Humanization Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">Readability</label>
                      <select
                        value={readability}
                        onChange={(e) => setReadability(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all backdrop-blur-sm"
                      >
                        <option value="Elementary" className="bg-black text-white">Elementary</option>
                        <option value="High School" className="bg-black text-white">High School</option>
                        <option value="University" className="bg-black text-white">University</option>
                        <option value="Doctorate" className="bg-black text-white">Doctorate</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">Purpose</label>
                      <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all backdrop-blur-sm"
                      >
                        <option value="General Writing" className="bg-black text-white">General Writing</option>
                        <option value="Essay" className="bg-black text-white">Essay</option>
                        <option value="Article" className="bg-black text-white">Article</option>
                        <option value="Marketing Material" className="bg-black text-white">Marketing Material</option>
                        <option value="Story" className="bg-black text-white">Story</option>
                        <option value="Cover Letter" className="bg-black text-white">Cover Letter</option>
                        <option value="Report" className="bg-black text-white">Report</option>
                        <option value="Business Material" className="bg-black text-white">Business Material</option>
                        <option value="Legal Material" className="bg-black text-white">Legal Material</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">Strength</label>
                      <select
                        value={strength}
                        onChange={(e) => setStrength(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all backdrop-blur-sm"
                      >
                        <option value="More Human" className="bg-black text-white">More Human</option>
                        <option value="Balanced" className="bg-black text-white">Balanced</option>
                        <option value="More Creative" className="bg-black text-white">More Creative</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full h-64 p-6 bg-white/5 border-2 border-white/20 rounded-2xl resize-none focus:ring-4 focus:ring-white/20 focus:border-white/50 transition-all duration-300 text-white placeholder-gray-500 backdrop-blur-sm"
                    placeholder="Paste your AI-generated text here and watch it transform into natural, human-like content..."
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-gray-300 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
                    {inputText.length} characters
                  </div>
                </div>
                
                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <X className="w-5 h-5 text-red-400" />
                      <div className="flex-1">
                        <p className="text-sm text-red-300">{error}</p>
                        {error.includes('Insufficient credits') && (
                          <p className="text-xs text-red-400 mt-1">
                            Please check your Undetectable API account balance and add more credits.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {inputText.split(/\s+/).filter(word => word.length > 0).length} words
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {outputText && currentDocumentId && subscriptionLimits?.hasRehumanization && (
                      <button
                        onClick={handleRehumanize}
                        disabled={isProcessing}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Zap className="w-5 h-5" />
                        )}
                        <span className="font-semibold">
                          {isProcessing ? 'Rehumanizing...' : 'Rehumanize'}
                        </span>
                      </button>
                    )}
                    
                    {isProcessing ? (
                      <button
                        onClick={stopPolling}
                        className="flex items-center space-x-2 px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <X className="w-5 h-5" />
                        <span className="font-semibold">Stop Processing</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleHumanize}
                        disabled={!inputText.trim()}
                        className="flex items-center space-x-2 px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <Zap className="w-5 h-5" />
                        <span className="font-semibold">Humanize Text</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Output Panel */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Humanized Output</h2>
                  <p className="text-sm text-gray-400">Your transformed content</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Translation Status */}
                {translationInfo && (
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <Languages className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">
                        Translated from {translationInfo.sourceLanguage} to {translationInfo.targetLanguage}
                      </span>
                    </div>
                    <button
                      onClick={handleClearTranslation}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Show Original
                    </button>
                  </div>
                )}

                <div className="relative">
                  <div className="w-full h-64 p-6 bg-white/5 border-2 border-white/20 rounded-2xl overflow-y-auto backdrop-blur-sm">
                    {isTranslating ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex items-center space-x-3">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <p className="text-gray-300 font-medium">Translating...</p>
                        </div>
                      </div>
                    ) : translatedText ? (
                      <div>
                        <p className="text-white leading-relaxed">{translatedText}</p>
                      </div>
                    ) : outputText ? (
                      <div>
                        <p className="text-white leading-relaxed">{outputText}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 font-medium">Humanized text will appear here</p>
                      </div>
                    )}
                  </div>
                  {(outputText || translatedText) && (
                    <div className="absolute bottom-4 right-4 text-xs text-gray-300 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
                      {(translatedText || outputText).length} characters
                    </div>
                  )}
                </div>
                
                {/* Language Selection */}
                {outputText && subscriptionLimits?.hasTranslation && (
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                    <Languages className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-white">Translate to:</span>
                    <div className="relative">
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="appearance-none bg-white/5 border border-white/20 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
                      >
                        <option value="en" className="bg-black text-white">English</option>
                        <option value="es" className="bg-black text-white">Spanish</option>
                        <option value="fr" className="bg-black text-white">French</option>
                        <option value="de" className="bg-black text-white">German</option>
                        <option value="it" className="bg-black text-white">Italian</option>
                        <option value="pt" className="bg-black text-white">Portuguese</option>
                        <option value="ru" className="bg-black text-white">Russian</option>
                        <option value="ja" className="bg-black text-white">Japanese</option>
                        <option value="ko" className="bg-black text-white">Korean</option>
                        <option value="zh" className="bg-black text-white">Chinese</option>
                        <option value="ar" className="bg-black text-white">Arabic</option>
                        <option value="hi" className="bg-black text-white">Hindi</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {translatedText && (
                        <button
                          onClick={handleClearTranslation}
                          className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 backdrop-blur-sm"
                        >
                          <X className="w-4 h-4" />
                          <span className="text-sm font-medium">Clear</span>
                        </button>
                      )}
                      
                      <button
                        onClick={handleTranslate}
                        disabled={isTranslating || !outputText}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {isTranslating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Languages className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {isTranslating ? 'Translating...' : translatedText ? 'Retranslate' : 'Translate'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                      <Download className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Export</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={handleCopy}
                    disabled={!outputText && !translatedText}
                    className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                    <span className="font-semibold">
                      {copied ? 'Copied!' : 'Copy Text'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Document History Section */}
          {subscriptionLimits?.hasDocumentHistory && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-16"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Document History
                  </h2>
                  <p className="text-slate-600">
                    View and manage your previous humanizations
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory) {
                      loadDocumentHistory();
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <History className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-700">
                    {showHistory ? 'Hide History' : 'Show History'}
                  </span>
                </button>
              </div>

            {showHistory && (
              <div className="space-y-4">
                {documentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No documents found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documentHistory.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span className="text-xs font-medium text-slate-600">
                                {new Date(doc.createdDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {doc.purpose}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Input</h3>
                            <p className="text-xs text-slate-600 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                              {doc.input}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Output</h3>
                            <p className="text-xs text-slate-600 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                              {doc.output}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                            <span className="text-xs text-slate-500">
                              {doc.readability}
                            </span>
                            <button
                              onClick={() => {
                                setInputText(doc.input);
                                setOutputText(doc.output);
                                setCurrentDocumentId(doc.id);
                              }}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              Load
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
          )}

          {/* AI Detectors Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                AI Humanizer can bypass these AI detectors
              </h2>
              <p className="text-slate-600">
                Our advanced technology ensures your content passes all major AI detection tools
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { name: 'Turnitin', logo: 'turnitin-logo.png' },
                { name: 'GPTZero', logo: 'gptzero-logo.png' }, 
                { name: 'Copyleak', logo: 'copyleak-logo.png' },
                { name: 'AI Detector', logo: 'zerogpt-logo.png' },
                { name: 'Quillbot', logo: 'quillbot-logo.png' },
                { name: 'Writer', logo: 'writer-logo.png' },
                { name: 'Sapling', logo: 'sapling-logo.png' },
                { name: 'Originality', logo: 'originality-logo.png' }
              ].map((detector, index) => (
                <motion.div
                  key={detector.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-4">
                    {/* Logo on the left */}
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-slate-100 group-hover:border-blue-200 transition-colors flex-shrink-0">
                      <Image 
                        src={`/dashboard/ai-humanize/${detector.logo}`} 
                        alt={`${detector.name} logo`}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Content on the right */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 mb-2">{detector.name}</h3>
                      <div className="flex items-center bg-emerald-50 rounded-full px-3 py-1 w-fit">
                        <CheckCircle className="w-3 h-3 text-emerald-600 mr-1" />
                        <span className="text-xs text-emerald-700 font-semibold">Bypassed</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
