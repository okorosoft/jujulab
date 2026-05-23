"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useCallback } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import { 
  Archive,
  History,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Copy,
  Calendar,
  FileText,
  Brain,
  Target,
  Loader2,
  RefreshCw,
  ChevronDown,
  SortAsc,
  SortDesc,
  Grid,
  List,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

type DocumentType = 'humanize' | 'detect' | 'grammar-check' | 'spell-check' | 'plagiarism-check' | 'translator' | 'html-to-text' | 'text-to-html' | 'pdf-to-html' | 'word-counter' | 'character-counter' | 'summarizer-text' | 'summarizer-pdf' | 'summarizer-word' | 'summarizer-youtube' | 'summarizer-image' | 'ai-homework-helper' | 'ai-math-solver' | 'ask-ai' | 'ai-image-detection' | 'ai-video-detection';

interface Document {
  id: string;
  type: DocumentType;
  title: string;
  input: string;
  output?: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
  wordCount: number;
  purpose?: string;
  readability?: string;
  strength?: string;
  aiProbability?: number;
  humanProbability?: number;
  confidence?: number;
  fileName?: string;
  toolMetadata?: Record<string, any>;
}

export default function DocumentsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | DocumentType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'wordCount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/';
    }
  }, [isLoaded, isSignedIn]);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all documents from the unified API
      const response = await fetch('/api/humanize/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      let allDocs: Document[] = [];
      if (response.ok) {
        const data = await response.json();
        allDocs = (data.documents || []).map((doc: any) => ({
          id: doc.id,
          type: doc.type,
          title: doc.title || `${getTypeLabelForTitle(doc.type)} Document - ${new Date(doc.createdAt).toLocaleDateString()}`,
          input: doc.input,
          output: doc.output,
          createdAt: doc.createdAt,
          status: doc.status || 'completed',
          wordCount: doc.wordCount || doc.input?.split(/\s+/).filter((word: string) => word.length > 0).length || 0,
          purpose: doc.purpose,
          readability: doc.readability,
          strength: doc.strength,
          aiProbability: doc.aiProbability,
          humanProbability: doc.humanProbability,
          confidence: doc.confidence,
          fileName: doc.fileName,
          toolMetadata: doc.toolMetadata,
        }));
      }

      setDocuments(allDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      loadDocuments();
    }
  }, [isSignedIn, loadDocuments]);

  const filterAndSortDocuments = useCallback(() => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'wordCount':
          comparison = a.wordCount - b.wordCount;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, filterType, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    filterAndSortDocuments();
  }, [filterAndSortDocuments]);

  const handleRefresh = () => {
    loadDocuments();
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/delete?id=${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state on success
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        console.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Delete each document
      const deletePromises = selectedDocuments.map(id => 
        fetch(`/api/documents/delete?id=${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
      setSelectedDocuments([]);
    } catch (error) {
      console.error('Error bulk deleting documents:', error);
    }
  };

  const handleCopyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'humanize': <Brain className="w-4 h-4 text-blue-400" />,
      'detect': <Target className="w-4 h-4 text-purple-400" />,
      'grammar-check': <FileText className="w-4 h-4 text-green-400" />,
      'spell-check': <FileText className="w-4 h-4 text-yellow-400" />,
      'plagiarism-check': <FileText className="w-4 h-4 text-red-400" />,
      'translator': <FileText className="w-4 h-4 text-cyan-400" />,
      'html-to-text': <FileText className="w-4 h-4 text-orange-400" />,
      'text-to-html': <FileText className="w-4 h-4 text-pink-400" />,
      'pdf-to-html': <FileText className="w-4 h-4 text-purple-400" />,
      'word-counter': <FileText className="w-4 h-4 text-indigo-400" />,
      'character-counter': <FileText className="w-4 h-4 text-violet-400" />,
      'summarizer-text': <FileText className="w-4 h-4 text-teal-400" />,
      'summarizer-pdf': <FileText className="w-4 h-4 text-teal-400" />,
      'summarizer-word': <FileText className="w-4 h-4 text-teal-400" />,
      'summarizer-youtube': <FileText className="w-4 h-4 text-teal-400" />,
      'summarizer-image': <FileText className="w-4 h-4 text-teal-400" />,
      'ai-homework-helper': <Brain className="w-4 h-4 text-blue-400" />,
      'ai-math-solver': <Brain className="w-4 h-4 text-indigo-400" />,
      'ask-ai': <Brain className="w-4 h-4 text-pink-400" />,
      'ai-image-detection': <Eye className="w-4 h-4 text-orange-400" />,
      'ai-video-detection': <Eye className="w-4 h-4 text-red-400" />,
    };
    return iconMap[type] || <FileText className="w-4 h-4 text-gray-400" />;
  };

  const getTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      'humanize': 'AI Humanize',
      'detect': 'AI Detection',
      'grammar-check': 'Grammar Check',
      'spell-check': 'Spell Check',
      'plagiarism-check': 'Plagiarism Check',
      'translator': 'AI Translator',
      'html-to-text': 'HTML to Text',
      'text-to-html': 'Text to HTML',
      'pdf-to-html': 'PDF to HTML',
      'word-counter': 'Word Counter',
      'character-counter': 'Character Counter',
      'summarizer-text': 'Text Summarizer',
      'summarizer-pdf': 'PDF Summarizer',
      'summarizer-word': 'Word Summarizer',
      'summarizer-youtube': 'YouTube Summarizer',
      'summarizer-image': 'Image Summarizer',
      'ai-homework-helper': 'AI Homework Helper',
      'ai-math-solver': 'AI Math Solver',
      'ask-ai': 'Ask AI',
      'ai-image-detection': 'AI Image Detection',
      'ai-video-detection': 'AI Video Detection',
    };
    return labelMap[type] || type;
  };

  const getTypeLabelForTitle = (type: string) => {
    const labelMap: Record<string, string> = {
      'humanize': 'Humanized',
      'detect': 'Detected',
      'grammar-check': 'Grammar Checked',
      'spell-check': 'Spell Checked',
      'plagiarism-check': 'Plagiarism Checked',
      'translator': 'Translated',
      'html-to-text': 'HTML to Text',
      'text-to-html': 'Text to HTML',
      'pdf-to-html': 'PDF to HTML',
      'word-counter': 'Word Counted',
      'character-counter': 'Character Counted',
      'summarizer-text': 'Text Summarized',
      'summarizer-pdf': 'PDF Summarized',
      'summarizer-word': 'Word Summarized',
      'summarizer-youtube': 'YouTube Summarized',
      'summarizer-image': 'Image Summarized',
      'ai-homework-helper': 'Homework Solved',
      'ai-math-solver': 'Math Solved',
      'ask-ai': 'AI Chat',
      'ai-image-detection': 'Image Detected',
      'ai-video-detection': 'Video Detected',
    };
    return labelMap[type] || type;
  };

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />

      <div className="lg:pl-64 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Documents & History
                </h1>
                <p className="text-gray-400">
                  Manage your AI humanization and detection documents
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors backdrop-blur-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium text-white">Refresh</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white font-medium placeholder-gray-500 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-3 bg-white/10 border-2 border-white/20 hover:border-white/30 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <Filter className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">Filters</span>
                  <ChevronDown className={`w-4 h-4 text-white transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-white/10 border-2 border-white/20 rounded-lg p-1 backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/20 shadow-sm' : 'hover:bg-white/10'}`}
                  >
                    <Grid className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/20 shadow-sm' : 'hover:bg-white/10'}`}
                  >
                    <List className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white/5 border-2 border-white/20 rounded-lg text-white font-medium focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors backdrop-blur-sm"
                    >
                      <option value="all" className="bg-black text-white">All Types</option>
                      <option value="humanize" className="bg-black text-white">AI Humanize</option>
                      <option value="detect" className="bg-black text-white">AI Detection</option>
                      <option value="grammar-check" className="bg-black text-white">Grammar Check</option>
                      <option value="spell-check" className="bg-black text-white">Spell Check</option>
                      <option value="plagiarism-check" className="bg-black text-white">Plagiarism Check</option>
                      <option value="translator" className="bg-black text-white">AI Translator</option>
                      <option value="summarizer-text" className="bg-black text-white">Summarizer</option>
                      <option value="ai-homework-helper" className="bg-black text-white">AI Homework Helper</option>
                      <option value="ai-math-solver" className="bg-black text-white">AI Math Solver</option>
                      <option value="ask-ai" className="bg-black text-white">Ask AI</option>
                      <option value="ai-image-detection" className="bg-black text-white">AI Image Detection</option>
                      <option value="ai-video-detection" className="bg-black text-white">AI Video Detection</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white/5 border-2 border-white/20 rounded-lg text-white font-medium focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors backdrop-blur-sm"
                    >
                      <option value="all" className="bg-black text-white">All Status</option>
                      <option value="completed" className="bg-black text-white">Completed</option>
                      <option value="processing" className="bg-black text-white">Processing</option>
                      <option value="failed" className="bg-black text-white">Failed</option>
                    </select>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Sort By</label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="flex-1 px-3 py-2.5 bg-white/5 border-2 border-white/20 rounded-lg text-white font-medium focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors backdrop-blur-sm"
                      >
                        <option value="date" className="bg-black text-white">Date</option>
                        <option value="type" className="bg-black text-white">Type</option>
                        <option value="wordCount" className="bg-black text-white">Word Count</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-2.5 bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/30 rounded-lg transition-colors backdrop-blur-sm"
                      >
                        {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-white" /> : <SortDesc className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-300">
                  {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete Selected</span>
                  </button>
                  <button
                    onClick={() => setSelectedDocuments([])}
                    className="px-3 py-2 text-sm font-medium text-white hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Documents Grid/List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {(!isLoaded || !isSignedIn || isLoading) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                      <div className="w-16 h-5 bg-white/10 rounded"></div>
                    </div>
                    <div className="w-full h-6 bg-white/10 rounded mb-2"></div>
                    <div className="w-32 h-4 bg-white/10 rounded mb-4"></div>
                    <div className="w-full h-20 bg-white/10 rounded mb-4"></div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="w-20 h-4 bg-white/10 rounded"></div>
                      <div className="w-16 h-4 bg-white/10 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-16">
                <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No documents found</h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Start by using AI Humanize or AI Detector to create your first document'
                  }
                </p>
                {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
                  <div className="flex items-center justify-center space-x-4">
                    <a
                      href="/dashboard/ai-humanize"
                      className="px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
                    >
                      AI Humanize
                    </a>
                    <a
                      href="/dashboard/ai-detector"
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                    >
                      AI Detector
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {filteredDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className={`bg-white/5 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all duration-300 ${
                      viewMode === 'list' ? 'p-6' : 'p-6'
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      // Grid View
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(doc.type)}
                            <div>
                              <h3 className="font-semibold text-white text-sm">
                                {getTypeLabel(doc.type)}
                              </h3>
                              <p className="text-xs text-gray-400">
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(doc.status)}
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocuments(prev => [...prev, doc.id]);
                                } else {
                                  setSelectedDocuments(prev => prev.filter(id => id !== doc.id));
                                }
                              }}
                              className="w-4 h-4 text-white rounded border-white/20 bg-white/5 focus:ring-white/50"
                            />
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div>
                          {doc.fileName && (
                            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {doc.fileName}
                            </p>
                          )}
                          <p className="text-sm text-gray-300 line-clamp-3 mb-2">
                            {doc.input}
                          </p>
                          {doc.output && (
                            <p className="text-sm text-gray-400 line-clamp-2">
                              <span className="font-medium text-white">Output:</span> {doc.output}
                            </p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{doc.wordCount} words</span>
                          {doc.aiProbability !== undefined && (
                            <span className="flex items-center gap-1">
                              <span className={doc.aiProbability > 50 ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>
                                {doc.aiProbability}% AI
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCopyText(doc.input)}
                              className="p-1.5 hover:bg-white/10 rounded-md transition-colors backdrop-blur-sm"
                              title="Copy input"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                            {doc.output && (
                              <button
                                onClick={() => handleCopyText(doc.output!)}
                                className="p-1.5 hover:bg-white/10 rounded-md transition-colors backdrop-blur-sm"
                                title="Copy output"
                              >
                                <Copy className="w-4 h-4 text-gray-400" />
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors backdrop-blur-sm"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // List View
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocuments(prev => [...prev, doc.id]);
                            } else {
                              setSelectedDocuments(prev => prev.filter(id => id !== doc.id));
                            }
                          }}
                          className="w-4 h-4 text-white rounded border-white/20 bg-white/5 focus:ring-white/50"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            {getTypeIcon(doc.type)}
                            <h3 className="font-semibold text-white truncate">
                              {doc.title}
                            </h3>
                            {getStatusIcon(doc.status)}
                          </div>
                          {doc.fileName && (
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {doc.fileName}
                            </p>
                          )}
                          <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                            {doc.input}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>{doc.wordCount} words</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            {doc.aiProbability !== undefined && (
                              <span className={doc.aiProbability > 50 ? 'text-red-400' : 'text-green-400'}>{doc.aiProbability}% AI</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopyText(doc.input)}
                            className="p-2 hover:bg-white/10 rounded-md transition-colors backdrop-blur-sm"
                            title="Copy input"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                          {doc.output && (
                            <button
                              onClick={() => handleCopyText(doc.output!)}
                              className="p-2 hover:bg-white/10 rounded-md transition-colors backdrop-blur-sm"
                              title="Copy output"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 hover:bg-red-500/20 rounded-md transition-colors backdrop-blur-sm"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
