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
  Send,
  Camera,
  Type,
  BookOpen,
  Sparkles,
  Calculator,
  Target,
  Leaf,
  FlaskConical,
  BookText,
  Globe,
  FileText,
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  ArrowUp,
  Download
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { trackToolUsage } from '@/lib/tool-usage-tracker';
import { saveDocument } from '@/lib/save-document';
import 'katex/dist/katex.min.css';
// @ts-ignore - react-katex doesn't have types
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  subject?: string;
  answerMode?: string;
}

const SUBJECTS = [
  { 
    name: 'Mathematics', 
    icon: Calculator, 
    color: 'bg-blue-500/20 border-blue-500/30',
    example: 'Solve the equation 2x² - 5x + 3 = 0'
  },
  { 
    name: 'Physics', 
    icon: Target, 
    color: 'bg-orange-500/20 border-orange-500/30',
    example: 'Calculate the displacement of an object in free fall after 5 seconds'
  },
  { 
    name: 'Biology', 
    icon: Leaf, 
    color: 'bg-purple-500/20 border-purple-500/30',
    example: 'Explain the process and significance of cell division'
  },
  { 
    name: 'Chemistry', 
    icon: FlaskConical, 
    color: 'bg-green-500/20 border-green-500/30',
    example: 'Balance the chemical equation: H₂ + O₂ → H₂O'
  },
  { 
    name: 'Literature', 
    icon: BookText, 
    color: 'bg-pink-500/20 border-pink-500/30',
    example: 'Analyze the mood and emotional expression in \'Quiet Night Thoughts\''
  },
  { 
    name: 'History', 
    icon: Globe, 
    color: 'bg-yellow-500/20 border-yellow-500/30',
    example: 'Analyze the impact of World War II on the global order'
  },
  { 
    name: 'Geography', 
    icon: Globe, 
    color: 'bg-cyan-500/20 border-cyan-500/30',
    example: 'Explain the formation of mountain ranges'
  },
  { 
    name: 'Computer Science', 
    icon: FileText, 
    color: 'bg-indigo-500/20 border-indigo-500/30',
    example: 'Explain the time complexity of binary search algorithm'
  },
  { 
    name: 'Foreign Language', 
    icon: BookOpen, 
    color: 'bg-rose-500/20 border-rose-500/30',
    example: 'Translate and explain the grammar in this sentence'
  }
];

const ANSWER_MODES = [
  { value: 'pure-answer', label: 'Pure Answer', description: 'Just the final answer', icon: CheckCircle2 },
  { value: 'detailed-explanation', label: 'Detailed Explanation', description: 'Comprehensive explanation with context', icon: BookOpen },
  { value: 'step-by-step', label: 'Step-by-Step', description: 'Solution broken into clear steps', icon: FileText },
  { value: 'study-guide', label: 'Study Guide', description: 'Quick formulas and key points', icon: GraduationCap },
  { value: 'correct-question', label: 'Correct Question', description: 'Corrections and correct answer', icon: Lightbulb },
  { value: 'generate-question', label: 'Generate Question', description: 'Generated similar questions', icon: Sparkles }
];

export default function AIHomeworkHelperPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [inputMode, setInputMode] = useState<'text' | 'photo'>('text');
  const [questionText, setQuestionText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0].name);
  const [selectedAnswerMode, setSelectedAnswerMode] = useState('step-by-step');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/';
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadAsDoc = (content: string, subject: string, answerMode: string) => {
    // Strip HTML tags from markdown content for cleaner text
    const textContent = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Create HTML content that Word can open
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${subject} - ${answerMode}</title>
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
    h4 { font-size: 12pt; font-weight: bold; margin-top: 14px; margin-bottom: 4px; }
    p { margin-bottom: 10px; }
    ul, ol { margin-left: 30px; margin-bottom: 10px; }
    li { margin-bottom: 5px; }
    code { font-family: 'Courier New', monospace; background-color: #f0f0f0; padding: 2px 4px; }
    pre { font-family: 'Courier New', monospace; background-color: #f0f0f0; padding: 10px; border: 1px solid #ccc; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background-color: #e0e0e0; font-weight: bold; }
    blockquote { border-left: 4px solid #ccc; padding-left: 15px; margin: 10px 0; font-style: italic; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    hr { border: none; border-top: 1px solid #000; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>${subject}</h1>
  <p><strong>Answer Mode:</strong> ${ANSWER_MODES.find(m => m.value === answerMode)?.label || answerMode}</p>
  <hr>
  <div>${textContent.replace(/\n/g, '<br>')}</div>
</body>
</html>
    `;

    // Convert HTML to blob
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `${subject.replace(/\s+/g, '_')}_${answerMode}_${timestamp}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImageSelect = (file: File | null) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      setError('Invalid file type. Please upload JPG, PNG, or WebP images only.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setSelectedImage(file);
    setInputMode('photo');
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const renderMarkdownWithMath = (text: string) => {
    if (!text) return null;

    // Split text into parts: markdown and math expressions
    const parts: Array<{ type: 'markdown' | 'math-display' | 'math-inline'; content: string }> = [];
    
    // Find all math expressions first
    const displayMathRegex = /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]/g;
    const inlineMathRegex = /(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)|\\\([^)]+?\\\)/g;
    
    const mathMatches: Array<{ start: number; end: number; type: 'display' | 'inline'; content: string }> = [];
    
    let match;
    displayMathRegex.lastIndex = 0;
    while ((match = displayMathRegex.exec(text)) !== null) {
      let content = match[0];
      if (content.startsWith('$$')) {
        content = content.replace(/^\$\$/, '').replace(/\$\$$/, '');
      } else if (content.startsWith('\\[')) {
        content = content.replace(/^\\\[/, '').replace(/\\\]$/, '');
      }
      mathMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'display',
        content: content.trim()
      });
    }
    
    inlineMathRegex.lastIndex = 0;
    while ((match = inlineMathRegex.exec(text)) !== null) {
      const isInsideDisplay = mathMatches.some(m => 
        match!.index >= m.start && match!.index < m.end
      );
      if (!isInsideDisplay) {
        let content = match[0];
        if (content.startsWith('$') && !content.startsWith('$$')) {
          content = content.replace(/^\$/, '').replace(/\$$/, '');
        } else if (content.startsWith('\\(')) {
          content = content.replace(/^\\\(/, '').replace(/\\\)$/, '');
        }
        mathMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'inline',
          content: content.trim()
        });
      }
    }
    
    mathMatches.sort((a, b) => a.start - b.start);
    
    // Build parts array
    let lastIndex = 0;
    mathMatches.forEach((mathMatch) => {
      if (mathMatch.start > lastIndex) {
        parts.push({
          type: 'markdown',
          content: text.substring(lastIndex, mathMatch.start)
        });
      }
      parts.push({
        type: mathMatch.type === 'display' ? 'math-display' : 'math-inline',
        content: mathMatch.content
      });
      lastIndex = mathMatch.end;
    });
    
    if (lastIndex < text.length) {
      parts.push({
        type: 'markdown',
        content: text.substring(lastIndex)
      });
    }
    
    // Render parts
    return (
      <>
        {parts.map((part, index) => {
          if (part.type === 'math-display') {
            try {
              return <BlockMath key={`math-display-${index}`} math={part.content} />;
            } catch (e) {
              return <div key={`math-error-${index}`} className="text-red-400">Math rendering error</div>;
            }
          } else if (part.type === 'math-inline') {
            try {
              return <InlineMath key={`math-inline-${index}`} math={part.content} />;
            } catch (e) {
              return <span key={`math-error-${index}`} className="text-red-400">Math error</span>;
            }
          } else {
            return (
              <ReactMarkdown
                key={`markdown-${index}`}
                remarkPlugins={[remarkGfm]}
                components={{
                  // Style headings
                  h1: ({ children, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-white" {...props}>{children}</h1>,
                  h2: ({ children, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-white" {...props}>{children}</h2>,
                  h3: ({ children, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-white" {...props}>{children}</h3>,
                  h4: ({ children, ...props }) => <h4 className="text-base font-bold mt-3 mb-2 text-white" {...props}>{children}</h4>,
                  h5: ({ children, ...props }) => <h5 className="text-sm font-bold mt-2 mb-1 text-white" {...props}>{children}</h5>,
                  h6: ({ children, ...props }) => <h6 className="text-sm font-semibold mt-2 mb-1 text-gray-300" {...props}>{children}</h6>,
                  // Style lists
                  ul: ({ children, ...props }) => <ul className="list-disc list-inside my-4 space-y-2 text-gray-300" {...props}>{children}</ul>,
                  ol: ({ children, ...props }) => <ol className="list-decimal list-inside my-4 space-y-2 text-gray-300" {...props}>{children}</ol>,
                  li: ({ children, ...props }) => <li className="ml-4" {...props}>{children}</li>,
                  // Style code blocks
                  code: ({ className, children, ...props }: any) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm text-gray-300" {...props}>{children}</code>
                    ) : (
                      <code className={className} {...props}>{children}</code>
                    );
                  },
                  pre: ({ children, ...props }) => (
                    <pre className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-x-auto my-4" {...props}>
                      {children}
                    </pre>
                  ),
                  // Style blockquotes
                  blockquote: ({ children, ...props }) => (
                    <blockquote className="border-l-4 border-white/30 pl-4 my-4 italic text-gray-300" {...props}>
                      {children}
                    </blockquote>
                  ),
                  // Style tables
                  table: ({ children, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-white/20" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children, ...props }) => <thead className="bg-white/10" {...props}>{children}</thead>,
                  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
                  tr: ({ children, ...props }) => <tr className="border-b border-white/10" {...props}>{children}</tr>,
                  th: ({ children, ...props }) => (
                    <th className="border border-white/20 px-4 py-2 text-left font-semibold text-white" {...props}>
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td className="border border-white/20 px-4 py-2 text-gray-300" {...props}>
                      {children}
                    </td>
                  ),
                  // Style links
                  a: ({ children, ...props }) => (
                    <a className="text-blue-400 hover:text-blue-300 underline" {...props}>
                      {children}
                    </a>
                  ),
                  // Style strong and emphasis
                  strong: ({ children, ...props }) => <strong className="font-bold text-white" {...props}>{children}</strong>,
                  em: ({ children, ...props }) => <em className="italic text-gray-200" {...props}>{children}</em>,
                  // Style horizontal rules
                  hr: ({ ...props }) => <hr className="border-white/20 my-6" {...props} />,
                }}
              >
                {part.content}
              </ReactMarkdown>
            );
          }
        })}
      </>
    );
  };

  const handleSolve = async () => {
    if (inputMode === 'text' && !questionText.trim()) {
      setError('Please enter a question');
      return;
    }

    if (inputMode === 'photo' && !selectedImage) {
      setError('Please upload an image');
      return;
    }

    setIsSolving(true);
    setError(null);

    try {
      let response;
      const userMessage: Message = {
        role: 'user',
        content: inputMode === 'text' ? questionText : '',
        imageUrl: inputMode === 'photo' && previewUrl ? previewUrl : undefined,
        subject: selectedSubject,
        answerMode: selectedAnswerMode
      };

      setMessages(prev => [...prev, userMessage]);

      if (inputMode === 'text') {
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        response = await fetch('/api/homework-helper/solve', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: questionText,
            subject: selectedSubject,
            answerMode: selectedAnswerMode,
            conversationHistory
          }),
        });
      } else {
        const imageBase64 = await convertImageToBase64(selectedImage!);
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        response = await fetch('/api/homework-helper/solve-image', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64,
            subject: selectedSubject,
            answerMode: selectedAnswerMode,
            conversationHistory
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get answer');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        subject: data.subject,
        answerMode: data.answerMode
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Track tool usage
      const wordCount = questionText.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
      trackToolUsage('ai-homework-helper', 'AI Homework Helper', wordCount);
      
      // Save document
      await saveDocument({
        type: 'ai-homework-helper',
        title: `${data.subject || 'Homework'} - ${selectedAnswerMode} - ${new Date().toLocaleDateString()}`,
        input: questionText,
        output: data.answer,
        wordCount: wordCount + (data.answer.split(/\s+/).filter((w: string) => w.length > 0).length || 0),
        toolMetadata: { 
          subject: data.subject, 
          answerMode: data.answerMode,
          hasImage: selectedImage !== null,
        },
      });
      
      setQuestionText('');
      
    } catch (error: any) {
      console.error('Solve error:', error);
      setError(error.message || 'Failed to solve homework problem');
    } finally {
      setIsSolving(false);
    }
  };

  if (!isLoaded) {
    return <SkeletonPage type="ai-detector" />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="max-w-6xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">AI Homework Helper</h1>
            </div>
            <p className="text-gray-400">
              Get instant help with your homework across all subjects. Upload a photo or ask a question.
            </p>
          </motion.div>

          {/* Subject Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Select a Subject</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SUBJECTS.map((subject) => {
                const Icon = subject.icon;
                return (
                  <motion.button
                    key={subject.name}
                    onClick={() => {
                      setSelectedSubject(subject.name);
                      setQuestionText(subject.example);
                    }}
                    disabled={isSolving}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedSubject === subject.name
                        ? `${subject.color} border-opacity-50 scale-105`
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    whileHover={{ scale: selectedSubject === subject.name ? 1.05 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${subject.color} bg-opacity-30`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1">{subject.name}</h3>
                        <p className="text-xs text-gray-400 line-clamp-2">{subject.example}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Answer Mode Selection - Dropdown Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-300">
                Answer Mode
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {ANSWER_MODES.map((mode) => {
                const ModeIcon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedAnswerMode(mode.value)}
                    disabled={isSolving}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                      selectedAnswerMode === mode.value
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <ModeIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Input Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setInputMode('text');
                  setSelectedImage(null);
                  setPreviewUrl(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  inputMode === 'text'
                    ? 'bg-white/20 text-white border-2 border-white/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border-2 border-transparent'
                }`}
                disabled={isSolving}
              >
                <Type className="w-4 h-4" />
                <span>Text</span>
              </button>
              <button
                onClick={() => setInputMode('photo')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  inputMode === 'photo'
                    ? 'bg-white/20 text-white border-2 border-white/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border-2 border-transparent'
                }`}
                disabled={isSolving}
              >
                <Camera className="w-4 h-4" />
                <span>Image</span>
              </button>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300"
            >
              {error}
            </motion.div>
          )}

          {/* Text Input */}
          {inputMode === 'text' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6"
            >
              <textarea
                ref={textareaRef}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSolve();
                  }
                }}
                placeholder="Enter problem or upload image/file here"
                className="w-full h-32 bg-white/5 border-2 border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 resize-none"
                disabled={isSolving}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSolve}
                  disabled={isSolving || !questionText.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Photo Input */}
          {inputMode === 'photo' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-6"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                className="hidden"
                disabled={isSolving}
              />
              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all duration-300"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-white font-medium mb-2">Click to upload a photo</p>
                  <p className="text-sm text-gray-400">Supported formats: JPG, PNG, WebP</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={previewUrl!}
                      alt="Homework image"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    onClick={handleImageRemove}
                    className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-black text-white rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Solve Button - Only show for photo mode */}
          {inputMode === 'photo' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <button
                onClick={handleSolve}
                disabled={isSolving || !selectedImage}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSolving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Solving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Get Answer</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="space-y-4"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {message.imageUrl && (
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={message.imageUrl}
                        alt="Homework image"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  {message.subject && message.answerMode && message.role === 'assistant' && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{message.subject}</span>
                        <span>•</span>
                        <span>{ANSWER_MODES.find(m => m.value === message.answerMode)?.label}</span>
                      </div>
                      <button
                        onClick={() => downloadAsDoc(message.content, message.subject || 'Homework', message.answerMode || 'step-by-step')}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors"
                        title="Download as Word document"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  )}
                  <div className="text-white leading-relaxed">
                    {message.role === 'assistant' ? (
                      <div className="markdown-content">
                        {renderMarkdownWithMath(message.content)}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {isSolving && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
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

