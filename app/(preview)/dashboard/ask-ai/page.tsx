"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { SkeletonPage } from '@/components/skeleton-loader';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Send,
  Bot,
  Loader2,
  User,
  Sparkles,
  Zap,
  Brain,
  Paperclip,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { trackToolUsage } from '@/lib/tool-usage-tracker';
import { saveDocument } from '@/lib/save-document';

type ModelType = 'gpt' | 'deepseek' | 'gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: ModelType;
  attachments?: {
    type: 'image' | 'file';
    name: string;
    url?: string;
    data?: string;
  }[];
}

export default function AskAIPage() {
  const { user } = useUser();
  const [selectedModel, setSelectedModel] = useState<ModelType>('gpt');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (type === 'image') {
        return file.type.startsWith('image/');
      }
      return true;
    });

    if (validFiles.length !== files.length) {
      toast.error(type === 'image' ? 'Please select only image files' : 'Invalid file type');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    // Convert attachments to base64 for display
    const attachmentPromises = attachments.map(async (file) => {
      return new Promise<{ type: 'image' | 'file'; name: string; data: string; mimeType: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            data: reader.result as string,
            mimeType: file.type,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    const attachmentData = await Promise.all(attachmentPromises);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (attachments.length > 0 ? 'See attached files' : ''),
      attachments: attachmentData.map(att => ({
        type: att.type,
        name: att.name,
        data: att.data,
      })),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', currentInput || (currentAttachments.length > 0 ? 'See attached files' : ''));
      formData.append('messages', JSON.stringify([...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }))));
      
      currentAttachments.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const response = await fetch(`/api/ask-ai/${selectedModel}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get response' }));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.content || 'No response generated',
        model: selectedModel,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Track tool usage
      const wordCount = currentInput.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
      const modelNames: Record<ModelType, string> = {
        'gpt': 'Ask AI (GPT-4o)',
        'deepseek': 'Ask AI (DeepSeek)',
        'gemini': 'Ask AI (Gemini)',
      };
      trackToolUsage('ask-ai', modelNames[selectedModel] || 'Ask AI', wordCount);
      
      // Save document (save the conversation)
      const conversationText = [...messages, userMessage, assistantMessage]
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      
      await saveDocument({
        type: 'ask-ai',
        title: `${modelNames[selectedModel]} Chat - ${new Date().toLocaleDateString()}`,
        input: currentInput || (currentAttachments.length > 0 ? `Attachments: ${currentAttachments.map(f => f.name).join(', ')}` : ''),
        output: assistantMessage.content,
        wordCount: wordCount + (assistantMessage.content.split(/\s+/).filter(w => w.length > 0).length || 0),
        toolMetadata: { model: selectedModel, attachmentsCount: currentAttachments.length },
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.message || 'Failed to get response from AI';
      
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  const getModelIcon = (model: ModelType) => {
    switch (model) {
      case 'gpt':
        return <Sparkles className="w-4 h-4" />;
      case 'deepseek':
        return <Zap className="w-4 h-4" />;
      case 'gemini':
        return <Brain className="w-4 h-4" />;
    }
  };

  const getModelName = (model: ModelType) => {
    switch (model) {
      case 'gpt':
        return 'GPT-4o';
      case 'deepseek':
        return 'DeepSeek';
      case 'gemini':
        return 'Gemini';
    }
  };

  if (!user) {
    return <SkeletonPage type="ai-detector" />;
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <DashboardSidebar />
      <div className="lg:pl-64 h-full">
        <div className="max-w-4xl mx-auto p-6 h-full flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold mb-2">Ask AI</h1>
            <p className="text-gray-400">
              Chat with GPT-4o, DeepSeek, or Gemini AI models
            </p>
          </motion.div>

          {/* Model Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4"
          >
            <Card className="bg-black/50 border-white/20">
              <CardContent className="p-4">
                <Label className="text-sm text-gray-400 mb-3 block">Select AI Model</Label>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setSelectedModel('gpt')}
                    variant={selectedModel === 'gpt' ? 'default' : 'outline'}
                    className={`flex-1 ${selectedModel === 'gpt' ? 'bg-white text-black hover:bg-gray-200' : 'border-white/20 text-white hover:bg-white/10'}`}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    GPT-4o
                  </Button>
                  <Button
                    onClick={() => setSelectedModel('deepseek')}
                    variant={selectedModel === 'deepseek' ? 'default' : 'outline'}
                    className={`flex-1 ${selectedModel === 'deepseek' ? 'bg-white text-black hover:bg-gray-200' : 'border-white/20 text-white hover:bg-white/10'}`}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    DeepSeek
                  </Button>
                  <Button
                    onClick={() => setSelectedModel('gemini')}
                    variant={selectedModel === 'gemini' ? 'default' : 'outline'}
                    className={`flex-1 ${selectedModel === 'gemini' ? 'bg-white text-black hover:bg-gray-200' : 'border-white/20 text-white hover:bg-white/10'}`}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Gemini
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat Messages */}
          <Card className="bg-black/50 border-white/20 flex-1 flex flex-col mb-4 min-h-0">
            <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Chat
              </CardTitle>
              {messages.length > 0 && (
                <Button
                  onClick={clearChat}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  Clear Chat
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Bot className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">Start a conversation with {getModelName(selectedModel)}</p>
                  <p className="text-sm mt-2">Select a model above and type your message</p>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        {message.model ? getModelIcon(message.model) : <Bot className="w-4 h-4" />}
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-gray-200'
                      }`}
                    >
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {message.attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-black/30 rounded">
                              {att.type === 'image' && att.data ? (
                                <Image 
                                  src={att.data} 
                                  alt={att.name}
                                  width={320}
                                  height={192}
                                  className="max-w-xs max-h-48 rounded object-contain"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Paperclip className="w-4 h-4" />
                                  <span className="text-sm">{att.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {message.role === 'assistant' ? (
                        <div className="markdown-content prose prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      {message.model && (
                        <p className="text-xs text-gray-400 mt-2">
                          {getModelName(message.model)}
                        </p>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    {getModelIcon(selectedModel)}
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
          </Card>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-black/50 border-white/20">
              <CardContent className="p-4 space-y-3">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm"
                      >
                        {file.type.startsWith('image/') ? (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                          </>
                        ) : (
                          <>
                            <Paperclip className="w-4 h-4" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                          </>
                        )}
                        <Button
                          onClick={() => removeAttachment(index)}
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-white/20"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex gap-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'image')}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => handleFileSelect(e, 'file')}
                      className="hidden"
                    />
                    <Button
                      onClick={() => imageInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      disabled={isLoading}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      disabled={isLoading}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask ${getModelName(selectedModel)} anything...`}
                    disabled={isLoading}
                    className="flex-1 bg-black/50 border-white/20 text-white placeholder:text-gray-500"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && attachments.length === 0)}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

