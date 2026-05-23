"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { SkeletonPage } from '@/components/skeleton-loader';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SpellCheck,
  FileCheck,
  CopyCheck,
  Languages,
  Code,
  FileText,
  Hash,
  Type
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getFreeTools } from '@/lib/tool-definitions';

const tools = [
  {
    id: 'grammar-check',
    name: 'Grammar Check',
    description: 'Check and correct grammar errors in your text',
    icon: SpellCheck,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    id: 'spell-check',
    name: 'Spell Check',
    description: 'Find and fix spelling mistakes',
    icon: FileCheck,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  {
    id: 'plagiarism-check',
    name: 'Plagiarism Check',
    description: 'Detect plagiarism using ZeroGPT',
    icon: CopyCheck,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  {
    id: 'translator',
    name: 'AI Translator',
    description: 'Translate text between multiple languages',
    icon: Languages,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  {
    id: 'html-to-text',
    name: 'HTML to Text',
    description: 'Convert HTML code to plain text',
    icon: Code,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
  },
  {
    id: 'text-to-html',
    name: 'Text to HTML',
    description: 'Convert plain text to HTML format',
    icon: FileText,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  {
    id: 'pdf-to-html',
    name: 'PDF to HTML',
    description: 'Convert PDF documents to HTML',
    icon: FileText,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words and characters in your text',
    icon: Hash,
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
  },
  {
    id: 'character-counter',
    name: 'Character Counter',
    description: 'Count characters, words, and paragraphs',
    icon: Type,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-400/10',
  },
];

interface ToolStatus {
  purchased: boolean;
  activated: boolean;
}

export default function AIToolsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [toolStatuses, setToolStatuses] = useState<Record<string, ToolStatus>>({});
  const [loading, setLoading] = useState(true);

  // Free tools that should always be shown
  const freeToolIds = ['word-counter', 'character-counter'];
  const freeTools = getFreeTools();

  useEffect(() => {
    const loadToolStatuses = async () => {
      try {
        const response = await fetch('/api/tools/status');
        if (response.ok) {
          const data = await response.json();
          setToolStatuses(data.tools || {});
        }
      } catch (error) {
        console.error('Error loading tool statuses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadToolStatuses();
    }
  }, [user]);

  const handleToolClick = (toolId: string) => {
    router.push(`/dashboard/ai-tools/${toolId}`);
  };

  // Filter tools to only show free tools or purchased/activated tools
  const availableTools = tools.filter(tool => {
    // Always show free tools
    if (freeToolIds.includes(tool.id)) {
      return true;
    }
    
    // For purchasable tools, only show if purchased
    const status = toolStatuses[tool.id];
    return status?.purchased === true;
  });

  if (!user || loading) {
    return (
      <>
        <DashboardSidebar />
        <SkeletonPage type="ai-detector" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardSidebar />
      <div className="lg:pl-64 pt-16 pb-16">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">AI Tools</h1>
            <p className="text-gray-400">
              Powerful AI-powered tools to enhance your writing and content
            </p>
          </motion.div>

          {/* Tools Grid */}
          {availableTools.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12"
            >
              <p className="text-gray-400 text-lg mb-4">
                No AI tools available. Purchase tools from the Market to unlock them.
              </p>
              <button
                onClick={() => router.push('/dashboard/market')}
                className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Visit Market
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTools.map((tool, index) => {
                const Icon = tool.icon;
                const isFree = freeToolIds.includes(tool.id);
                return (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      onClick={() => handleToolClick(tool.id)}
                      className={`bg-black/50 border-white/20 cursor-pointer hover:bg-black/70 transition-all hover:scale-105 ${tool.bgColor} relative`}
                    >
                      {isFree && (
                        <div className="absolute top-2 right-2 bg-blue-500/90 text-white px-2 py-1 rounded text-xs font-bold">
                          FREE
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                            <Icon className={`w-6 h-6 ${tool.color}`} />
                          </div>
                          <span>{tool.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm">{tool.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

