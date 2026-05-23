"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { SkeletonPage } from '@/components/skeleton-loader';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Upload,
  Youtube,
  Image as ImageIcon,
  MessageSquare,
  File,
  Download,
  ArrowUp,
  Loader2,
  CheckCircle,
  X,
  FileIcon,
  FileText as WordIcon
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { trackToolUsage } from '@/lib/tool-usage-tracker';
import { saveDocument } from '@/lib/save-document';

interface SummaryResult {
  summary: string;
  keyPoints?: string[];
  wordCount?: number;
  processingTime?: number;
}

type SummarizerType = 'text' | 'pdf' | 'word' | 'youtube' | 'image';

export default function SummarizerPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<SummarizerType>('text');
  const [inputText, setInputText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const summarizeText = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to summarize');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/summarizer/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize text');
      }

      const data = await response.json();
      setResult(data);
      const wordCount = inputText.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
      trackToolUsage('summarizer-text', 'Text Summarizer', wordCount);
      
      // Save document
      await saveDocument({
        type: 'summarizer-text',
        title: `Text Summary - ${new Date().toLocaleDateString()}`,
        input: inputText,
        output: data.summary,
        wordCount,
      });
      
      toast.success('Text summarized successfully');
    } catch (error) {
      console.error('Error summarizing text:', error);
      toast.error('Failed to summarize text');
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeFile = async (type: 'pdf' | 'word') => {
    if (!selectedFile) {
      toast.error(`Please select a ${type.toUpperCase()} file`);
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/summarizer/${type}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to summarize ${type.toUpperCase()} file`);
      }

      const data = await response.json();
      setResult(data);
      const toolNames: Record<string, string> = {
        'pdf': 'PDF Summarizer',
        'word': 'Word Summarizer',
      };
      const wordCount = data.wordCount || 0;
      trackToolUsage(`summarizer-${type}`, toolNames[type] || `${type.toUpperCase()} Summarizer`, wordCount);
      
      // Save document
      await saveDocument({
        type: `summarizer-${type}`,
        title: `${toolNames[type] || type.toUpperCase()} Summary - ${new Date().toLocaleDateString()}`,
        input: selectedFile?.name || 'File',
        output: data.summary,
        wordCount,
        fileName: selectedFile?.name,
      });
      
      toast.success(`${type.toUpperCase()} summarized successfully`);
    } catch (error: any) {
      console.error(`Error summarizing ${type} file:`, error);
      const errorMessage = error.message || `Failed to summarize ${type.toUpperCase()} file`;
      
      // Check if it's a credit error
      if (errorMessage.toLowerCase().includes('insufficient credits') || errorMessage.toLowerCase().includes('need')) {
        toast.error('Insufficient Credits', {
          description: errorMessage + ' Please purchase credits to continue.',
          action: {
            label: 'Buy Credits',
            onClick: () => window.location.href = '/dashboard/credits'
          },
          duration: 6000,
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeYouTube = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/summarizer/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to summarize YouTube video' }));
        const errorMessage = errorData.error || 'Failed to summarize YouTube video';
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setResult(data);
      const wordCount = data.wordCount || 0;
      trackToolUsage('summarizer-youtube', 'YouTube Video Summarizer', wordCount);
      
      // Save document
      await saveDocument({
        type: 'summarizer-youtube',
        title: `YouTube Summary - ${new Date().toLocaleDateString()}`,
        input: youtubeUrl,
        output: data.summary,
        wordCount,
        toolMetadata: { videoUrl: youtubeUrl },
      });
      
      toast.success('YouTube video summarized successfully');
    } catch (error: any) {
      console.error('Error summarizing YouTube video:', error);
      // Only show error if it wasn't already shown (network errors, etc.)
      if (error.message && !error.message.includes('No transcript')) {
        const errorMessage = error.message || 'Failed to summarize YouTube video';
        
        // Check if it's a credit error
        if (errorMessage.toLowerCase().includes('insufficient credits') || errorMessage.toLowerCase().includes('need')) {
          toast.error('Insufficient Credits', {
            description: errorMessage + ' Please purchase credits to continue.',
            action: {
              label: 'Buy Credits',
              onClick: () => window.location.href = '/dashboard/credits'
            },
            duration: 6000,
          });
        } else {
          toast.error(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/summarizer/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to summarize image' }));
        throw new Error(errorData.error || 'Failed to summarize image');
      }

      const data = await response.json();
      setResult(data);
      const wordCount = data.wordCount || 0;
      trackToolUsage('summarizer-image', 'Image Summarizer', wordCount);
      
      // Save document
      await saveDocument({
        type: 'summarizer-image',
        title: `Image Summary - ${new Date().toLocaleDateString()}`,
        input: selectedFile?.name || 'Image',
        output: data.summary,
        wordCount,
        fileName: selectedFile?.name,
      });
      
      toast.success('Image summarized successfully');
    } catch (error) {
      console.error('Error summarizing image:', error);
      toast.error('Failed to summarize image');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;

    // Use the HTML content directly (already formatted from API)
    const summaryHtml = result.summary;

    const keyPointsHtml = result.keyPoints && result.keyPoints.length > 0
      ? `<h2>Key Points:</h2><ul>${result.keyPoints.map(point => `<li>${point}</li>`).join('')}</ul>`
      : '';

    // Create HTML content that Word can open
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI Summarizer Result</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      margin: 40px;
      color: #000;
    }
    h1 { font-size: 18pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
    h2 { font-size: 16pt; font-weight: bold; margin-top: 18px; margin-bottom: 8px; }
    h3 { font-size: 14pt; font-weight: bold; margin-top: 16px; margin-bottom: 6px; }
    p { margin-bottom: 12px; text-align: justify; }
    ul { margin-left: 30px; margin-bottom: 12px; }
    li { margin-bottom: 6px; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    table td, table th { border: 1px solid #ccc; padding: 8px; }
    table th { background-color: #f0f0f0; font-weight: bold; }
    code { font-family: 'Courier New', monospace; background-color: #f5f5f5; padding: 2px 4px; }
    .metadata { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 10pt; color: #666; }
  </style>
</head>
<body>
  ${summaryHtml}
  
  ${keyPointsHtml}
  
  <div class="metadata">
    ${result.wordCount ? `<p><strong>Word Count:</strong> ${result.wordCount}</p>` : ''}
    ${result.processingTime ? `<p><strong>Processing Time:</strong> ${result.processingTime}ms</p>` : ''}
  </div>
</body>
</html>
    `.trim();

    // Create blob with HTML content
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return <SkeletonPage type="ai-detector" />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">AI Summarizer</h1>
            <p className="text-gray-400">
              Summarize text, documents, videos, and images with AI-powered analysis
            </p>
          </motion.div>

          {/* Summarizer Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SummarizerType)}>
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 bg-black/50 border border-white/20">
                <TabsTrigger value="text" className="flex items-center gap-2 data-[state=active]:bg-white/20">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Text</span>
                </TabsTrigger>
                <TabsTrigger value="pdf" className="flex items-center gap-2 data-[state=active]:bg-white/20">
                  <File className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </TabsTrigger>
                <TabsTrigger value="word" className="flex items-center gap-2 data-[state=active]:bg-white/20">
                  <WordIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Word</span>
                </TabsTrigger>
                <TabsTrigger value="youtube" className="flex items-center gap-2 data-[state=active]:bg-white/20">
                  <Youtube className="w-4 h-4" />
                  <span className="hidden sm:inline">YouTube</span>
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-2 data-[state=active]:bg-white/20">
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Image</span>
                </TabsTrigger>
              </TabsList>

              {/* Text Summarizer */}
              <TabsContent value="text" className="space-y-6">
                <Card className="bg-black/50 border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      AI Text Summarizer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="text-input">Enter text to summarize</Label>
                      <textarea
                        id="text-input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste or type your text here..."
                        className="w-full h-32 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                      />
                    </div>
                    <Button
                      onClick={summarizeText}
                      disabled={isLoading || !inputText.trim()}
                      className="w-full bg-white text-black hover:bg-gray-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Summarize Text
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PDF Summarizer */}
              <TabsContent value="pdf" className="space-y-6">
                <Card className="bg-black/50 border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <File className="w-5 h-5" />
                      PDF Summarizer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="pdf-input">Select PDF file</Label>
                      <p className="text-xs text-gray-400 mt-1 mb-2">Maximum file size: 10MB</p>
                      <div className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="pdf-input"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="w-full border-white/20 text-white hover:bg-white/10"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose PDF File
                        </Button>
                      </div>
                      {selectedFile && (
                        <div className="mt-2 flex items-center justify-between p-2 bg-white/10 rounded-lg">
                          <span className="text-sm text-gray-300 truncate">{selectedFile.name}</span>
                          <Button
                            onClick={removeFile}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => summarizeFile('pdf')}
                      disabled={isLoading || !selectedFile}
                      className="w-full bg-white text-black hover:bg-gray-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Summarize PDF
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Word Summarizer */}
              <TabsContent value="word" className="space-y-6">
                <Card className="bg-black/50 border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <WordIcon className="w-5 h-5" />
                      Word Document Summarizer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="word-input">Select Word file</Label>
                      <p className="text-xs text-gray-400 mt-1 mb-2">Maximum file size: 10MB</p>
                      <div className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".doc,.docx"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="word-input"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="w-full border-white/20 text-white hover:bg-white/10"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Word File
                        </Button>
                      </div>
                      {selectedFile && (
                        <div className="mt-2 flex items-center justify-between p-2 bg-white/10 rounded-lg">
                          <span className="text-sm text-gray-300 truncate">{selectedFile.name}</span>
                          <Button
                            onClick={removeFile}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => summarizeFile('word')}
                      disabled={isLoading || !selectedFile}
                      className="w-full bg-white text-black hover:bg-gray-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Summarize Word Document
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* YouTube Summarizer */}
              <TabsContent value="youtube" className="space-y-6">
                <Card className="bg-black/50 border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Youtube className="w-5 h-5" />
                      YouTube Video Summarizer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="youtube-input">YouTube URL</Label>
                      <Input
                        id="youtube-input"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      />
                    </div>
                    <Button
                      onClick={summarizeYouTube}
                      disabled={isLoading || !youtubeUrl.trim()}
                      className="w-full bg-white text-black hover:bg-gray-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <Youtube className="w-4 h-4 mr-2" />
                          Summarize YouTube Video
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Image Summarizer */}
              <TabsContent value="image" className="space-y-6">
                <Card className="bg-black/50 border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Image to Text & Summarizer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="image-input">Select image file</Label>
                      <p className="text-xs text-gray-400 mt-1 mb-2">Maximum file size: 5MB</p>
                      <div className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="image-input"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="w-full border-white/20 text-white hover:bg-white/10"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Image File
                        </Button>
                      </div>
                      {selectedFile && (
                        <div className="mt-2 flex items-center justify-between p-2 bg-white/10 rounded-lg">
                          <span className="text-sm text-gray-300 truncate">{selectedFile.name}</span>
                          <Button
                            onClick={removeFile}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={summarizeImage}
                      disabled={isLoading || !selectedFile}
                      className="w-full bg-white text-black hover:bg-gray-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Extract & Summarize Image
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-black/50 border-white/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Summary Result
                  </CardTitle>
                  <Button
                    onClick={downloadResult}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download as DOC
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Summary:</h4>
                    <div 
                      className="markdown-content prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: result.summary }}
                    />
                  </div>

                  {result.keyPoints && result.keyPoints.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Key Points:</h4>
                      <div className="markdown-content">
                        <ul className="list-disc list-inside space-y-1">
                          {result.keyPoints.map((point, index) => (
                            <li key={index}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <span>{children}</span> }}>
                                {point}
                              </ReactMarkdown>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {result.wordCount && (
                      <span>Word Count: {result.wordCount}</span>
                    )}
                    {result.processingTime && (
                      <span>Processing Time: {result.processingTime}ms</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Scroll to Top Button */}
          {showScrollToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full shadow-lg backdrop-blur-sm border border-white/20 transition-all z-50"
              title="Scroll to top"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
