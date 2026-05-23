"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { SkeletonPage } from '@/components/skeleton-loader';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Copy,
  Check,
  Upload,
  Download,
  FileText,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { trackToolUsage } from '@/lib/tool-usage-tracker';
import { saveDocument } from '@/lib/save-document';

type ToolId = 'grammar-check' | 'spell-check' | 'plagiarism-check' | 'translator' | 'html-to-text' | 'text-to-html' | 'pdf-to-html' | 'word-counter' | 'character-counter';

export default function ToolPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const toolId = params.toolId as ToolId;
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    if (isLanguageOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageOpen]);

  const languages = [
    { code: 'en', name: 'English', countryCode: 'us' },
    { code: 'es', name: 'Spanish', countryCode: 'es' },
    { code: 'fr', name: 'French', countryCode: 'fr' },
    { code: 'de', name: 'German', countryCode: 'de' },
    { code: 'it', name: 'Italian', countryCode: 'it' },
    { code: 'pt', name: 'Portuguese', countryCode: 'pt' },
    { code: 'ru', name: 'Russian', countryCode: 'ru' },
    { code: 'ja', name: 'Japanese', countryCode: 'jp' },
    { code: 'zh', name: 'Chinese', countryCode: 'cn' },
    { code: 'ar', name: 'Arabic', countryCode: 'sa' },
    { code: 'hi', name: 'Hindi', countryCode: 'in' },
    { code: 'ko', name: 'Korean', countryCode: 'kr' },
    { code: 'nl', name: 'Dutch', countryCode: 'nl' },
    { code: 'pl', name: 'Polish', countryCode: 'pl' },
    { code: 'tr', name: 'Turkish', countryCode: 'tr' },
    { code: 'vi', name: 'Vietnamese', countryCode: 'vn' },
    { code: 'th', name: 'Thai', countryCode: 'th' },
    { code: 'id', name: 'Indonesian', countryCode: 'id' },
    { code: 'ms', name: 'Malay', countryCode: 'my' },
    { code: 'sv', name: 'Swedish', countryCode: 'se' },
    { code: 'no', name: 'Norwegian', countryCode: 'no' },
    { code: 'da', name: 'Danish', countryCode: 'dk' },
    { code: 'fi', name: 'Finnish', countryCode: 'fi' },
    { code: 'cs', name: 'Czech', countryCode: 'cz' },
    { code: 'hu', name: 'Hungarian', countryCode: 'hu' },
    { code: 'ro', name: 'Romanian', countryCode: 'ro' },
    { code: 'el', name: 'Greek', countryCode: 'gr' },
    { code: 'he', name: 'Hebrew', countryCode: 'il' },
    { code: 'uk', name: 'Ukrainian', countryCode: 'ua' },
    { code: 'bg', name: 'Bulgarian', countryCode: 'bg' },
    { code: 'hr', name: 'Croatian', countryCode: 'hr' },
    { code: 'sk', name: 'Slovak', countryCode: 'sk' },
    { code: 'sl', name: 'Slovenian', countryCode: 'si' },
    { code: 'et', name: 'Estonian', countryCode: 'ee' },
    { code: 'lv', name: 'Latvian', countryCode: 'lv' },
    { code: 'lt', name: 'Lithuanian', countryCode: 'lt' },
    { code: 'ga', name: 'Irish', countryCode: 'ie' },
    { code: 'mt', name: 'Maltese', countryCode: 'mt' },
    { code: 'sw', name: 'Swahili', countryCode: 'ke' },
    { code: 'af', name: 'Afrikaans', countryCode: 'za' },
    { code: 'sq', name: 'Albanian', countryCode: 'al' },
    { code: 'az', name: 'Azerbaijani', countryCode: 'az' },
    { code: 'bn', name: 'Bengali', countryCode: 'bd' },
    { code: 'eu', name: 'Basque', countryCode: 'es' },
    { code: 'be', name: 'Belarusian', countryCode: 'by' },
    { code: 'bs', name: 'Bosnian', countryCode: 'ba' },
    { code: 'ca', name: 'Catalan', countryCode: 'es' },
    { code: 'cy', name: 'Welsh', countryCode: 'gb' },
    { code: 'fa', name: 'Persian', countryCode: 'ir' },
    { code: 'gl', name: 'Galician', countryCode: 'es' },
    { code: 'ka', name: 'Georgian', countryCode: 'ge' },
    { code: 'gu', name: 'Gujarati', countryCode: 'in' },
    { code: 'is', name: 'Icelandic', countryCode: 'is' },
    { code: 'kn', name: 'Kannada', countryCode: 'in' },
    { code: 'kk', name: 'Kazakh', countryCode: 'kz' },
    { code: 'km', name: 'Khmer', countryCode: 'kh' },
    { code: 'lo', name: 'Lao', countryCode: 'la' },
    { code: 'mk', name: 'Macedonian', countryCode: 'mk' },
    { code: 'ml', name: 'Malayalam', countryCode: 'in' },
    { code: 'mr', name: 'Marathi', countryCode: 'in' },
    { code: 'mn', name: 'Mongolian', countryCode: 'mn' },
    { code: 'my', name: 'Myanmar', countryCode: 'mm' },
    { code: 'ne', name: 'Nepali', countryCode: 'np' },
    { code: 'ps', name: 'Pashto', countryCode: 'af' },
    { code: 'pa', name: 'Punjabi', countryCode: 'in' },
    { code: 'sr', name: 'Serbian', countryCode: 'rs' },
    { code: 'si', name: 'Sinhala', countryCode: 'lk' },
    { code: 'ta', name: 'Tamil', countryCode: 'in' },
    { code: 'te', name: 'Telugu', countryCode: 'in' },
    { code: 'ur', name: 'Urdu', countryCode: 'pk' },
    { code: 'uz', name: 'Uzbek', countryCode: 'uz' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        setInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleProcess = async () => {
    if (!input.trim() && !selectedFile) {
      toast.error('Please enter text or upload a file');
      return;
    }

    setIsLoading(true);
    setOutput('');

    try {
      let response;
      let formData;

      switch (toolId) {
        case 'grammar-check':
        case 'spell-check':
        case 'translator':
          response = await fetch(`/api/ai-tools/${toolId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: input,
              targetLanguage: toolId === 'translator' ? targetLanguage : undefined,
            }),
          });
          break;

        case 'plagiarism-check':
          response = await fetch(`/api/ai-tools/${toolId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: input }),
          });
          break;

        case 'html-to-text':
        case 'text-to-html':
          response = await fetch(`/api/ai-tools/${toolId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: input }),
          });
          break;

        case 'pdf-to-html':
          formData = new FormData();
          if (selectedFile) {
            formData.append('file', selectedFile);
          } else {
            toast.error('Please upload a PDF document');
            setIsLoading(false);
            return;
          }
          response = await fetch(`/api/ai-tools/${toolId}`, {
            method: 'POST',
            body: formData,
          });
          break;

        case 'word-counter':
        case 'character-counter':
          // Client-side processing
          const words = input.trim().split(/\s+/).filter(w => w.length > 0).length;
          const characters = input.length;
          const charactersNoSpaces = input.replace(/\s/g, '').length;
          const paragraphs = input.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
          const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
          
          const counterOutput = `Word Count: ${words}\nCharacter Count (with spaces): ${characters}\nCharacter Count (without spaces): ${charactersNoSpaces}\nParagraph Count: ${paragraphs}\nSentence Count: ${sentences}`;
          setOutput(counterOutput);
          
          // Track tool usage
          const counterToolNames: Record<string, string> = {
            'word-counter': 'Word Counter',
            'character-counter': 'Character Counter',
          };
          trackToolUsage(toolId, counterToolNames[toolId] || toolId, words);
          
          // Save document
          await saveDocument({
            type: toolId,
            title: `${counterToolNames[toolId] || toolId} - ${new Date().toLocaleDateString()}`,
            input: input,
            output: counterOutput,
            wordCount: words,
          });
          
          setIsLoading(false);
          return;

        default:
          toast.error('Unknown tool');
          setIsLoading(false);
          return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to process' }));
        throw new Error(errorData.error || 'Failed to process');
      }

      const data = await response.json();
      const result = data.result || data.output || data.text || JSON.stringify(data);
      setOutput(result);
      
      // Track tool usage
      const toolNames: Record<string, string> = {
        'grammar-check': 'Grammar Check',
        'spell-check': 'Spell Check',
        'plagiarism-check': 'Plagiarism Check',
        'translator': 'AI Translator',
        'html-to-text': 'HTML to Text',
        'text-to-html': 'Text to HTML',
        'pdf-to-html': 'PDF to HTML',
        'word-counter': 'Word Counter',
        'character-counter': 'Character Counter',
      };
      
      const wordCount = input.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
      trackToolUsage(toolId, toolNames[toolId] || toolId, wordCount);
      
      // Save document
      const toolInput = selectedFile ? selectedFile.name : input;
      await saveDocument({
        type: toolId,
        title: `${toolNames[toolId] || toolId} - ${new Date().toLocaleDateString()}`,
        input: toolInput,
        output: result,
        wordCount,
        fileName: selectedFile?.name,
      });
      
      toast.success('Processed successfully');
    } catch (error: any) {
      console.error('Error processing:', error);
      toast.error(error.message || 'Failed to process');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    // Strip HTML tags for grammar-check and spell-check when copying
    const textToCopy = toolId === 'grammar-check' || toolId === 'spell-check'
      ? output.replace(/<mark>/g, '').replace(/<\/mark>/g, '')
      : output;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isHtmlTool = toolId === 'text-to-html' || toolId === 'pdf-to-html';
    const mimeType = isHtmlTool ? 'text/html' : 'text/plain';
    const extension = isHtmlTool ? 'html' : 'txt';
    
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolId}-result.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded successfully');
  };

  const getToolTitle = () => {
    const titles: Record<ToolId, string> = {
      'grammar-check': 'Grammar Check',
      'spell-check': 'Spell Check',
      'plagiarism-check': 'Plagiarism Check',
      'translator': 'AI Translator',
      'html-to-text': 'HTML to Text',
      'text-to-html': 'Text to HTML',
      'pdf-to-html': 'PDF to HTML',
      'word-counter': 'Word Counter',
      'character-counter': 'Character Counter',
    };
    return titles[toolId] || 'AI Tool';
  };

  if (!user) {
    return <SkeletonPage type="ai-detector" />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold">{getToolTitle()}</h1>
              <p className="text-gray-400">Process your text with AI-powered tools</p>
            </div>
          </motion.div>

          <div className="flex flex-col gap-6">
            {/* Input Section */}
            <Card className="bg-black/50 border-white/20">
              <CardHeader>
                <CardTitle>Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {toolId === 'pdf-to-html' ? (
                  <div>
                    <Label>Upload PDF Document</Label>
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {selectedFile ? selectedFile.name : 'Choose Word File'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Enter Text</Label>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter your text here..."
                        className="w-full mt-2 min-h-[300px] p-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder:text-gray-500 resize-none"
                      />
                    </div>
                    {toolId === 'translator' && (
                      <div className="relative" ref={languageDropdownRef}>
                        <Label className="text-white">Target Language</Label>
                        <button
                          type="button"
                          onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                          className="w-full mt-2 p-3 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 flex items-center justify-between cursor-pointer hover:bg-black/70 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            {(() => {
                              const selectedLang = languages.find(l => l.code === targetLanguage);
                              return selectedLang ? (
                                <>
                                  <Image 
                                    src={`https://flagcdn.com/w20/${selectedLang.countryCode}.png`}
                                    alt={selectedLang.name}
                                    width={20}
                                    height={16}
                                    className="w-5 h-4 object-cover rounded"
                                    unoptimized
                                  />
                                  {selectedLang.name}
                                </>
                              ) : null;
                            })()}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isLanguageOpen && (
                          <div className="absolute z-50 w-full mt-2 bg-black/95 border border-white/20 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => {
                                  setTargetLanguage(lang.code);
                                  setIsLanguageOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white/10 transition-colors ${
                                  targetLanguage === lang.code ? 'bg-white/20' : ''
                                }`}
                              >
                                <Image 
                                  src={`https://flagcdn.com/w20/${lang.countryCode}.png`}
                                  alt={lang.name}
                                  width={20}
                                  height={16}
                                  className="w-5 h-4 object-cover rounded"
                                  unoptimized
                                />
                                <span className="text-white">{lang.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                <Button
                  onClick={handleProcess}
                  disabled={isLoading || (!input.trim() && !selectedFile)}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="bg-black/50 border-white/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Output</CardTitle>
                {output && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {output ? (
                  <div className="min-h-[300px] p-3 bg-black/30 rounded-lg overflow-y-auto">
                    {toolId === 'text-to-html' || toolId === 'pdf-to-html' ? (
                      <pre className="whitespace-pre-wrap text-sm font-mono">{output}</pre>
                    ) : toolId === 'grammar-check' || toolId === 'spell-check' ? (
                      <div 
                        className="text-sm whitespace-pre-wrap grammar-output"
                        dangerouslySetInnerHTML={{ __html: output }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm">{output}</pre>
                    )}
                  </div>
                ) : (
                  <div className="min-h-[300px] flex items-center justify-center text-gray-400">
                    <p>Output will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

