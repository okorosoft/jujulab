// Centralized tool definitions for the market and credits system

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'ai-tools' | 'detection' | 'summarizer' | 'chat' | 'homework' | 'math' | 'core' | 'coding';
  icon: string; // Icon name for reference
  price: number; // Price to purchase tool ($1, or 0 for free tools)
  route: string; // Dashboard route
  isFree?: boolean; // True if tool is free (no purchase needed, but still requires credits)
}

export const ALL_TOOLS: ToolDefinition[] = [
  // Core Tools (always available, free but require credits)
  {
    id: 'ai-humanize',
    name: 'AI Humanize',
    description: 'Transform AI-generated content into human-like writing',
    category: 'core',
    icon: 'FileText',
    price: 0, // Free tool (no purchase needed, but requires credits)
    route: '/dashboard/ai-humanize',
    isFree: true,
  },
  {
    id: 'ai-detector',
    name: 'AI Detector',
    description: 'Detect AI-generated content using advanced algorithms',
    category: 'core',
    icon: 'BarChart3',
    price: 0, // Free tool (no purchase needed, but requires credits)
    route: '/dashboard/ai-detector',
    isFree: true,
  },

  // Detection Tools
  {
    id: 'ai-image-detection',
    name: 'AI Image Detection',
    description: 'Detect if images are AI-generated',
    category: 'detection',
    icon: 'Image',
    price: 1,
    route: '/dashboard/ai-image-detection',
  },
  {
    id: 'ai-video-detection',
    name: 'AI Video Detection',
    description: 'Detect if videos are AI-generated',
    category: 'detection',
    icon: 'Video',
    price: 1,
    route: '/dashboard/ai-video-detection',
  },

  // AI Tools
  {
    id: 'grammar-check',
    name: 'Grammar Check',
    description: 'Check and correct grammar errors in your text',
    category: 'ai-tools',
    icon: 'SpellCheck',
    price: 1,
    route: '/dashboard/ai-tools/grammar-check',
  },
  {
    id: 'spell-check',
    name: 'Spell Check',
    description: 'Find and fix spelling mistakes',
    category: 'ai-tools',
    icon: 'FileCheck',
    price: 1,
    route: '/dashboard/ai-tools/spell-check',
  },
  {
    id: 'plagiarism-check',
    name: 'Plagiarism Check',
    description: 'Detect plagiarism using ZeroGPT',
    category: 'ai-tools',
    icon: 'CopyCheck',
    price: 1,
    route: '/dashboard/ai-tools/plagiarism-check',
  },
  {
    id: 'translator',
    name: 'AI Translator',
    description: 'Translate text between multiple languages',
    category: 'ai-tools',
    icon: 'Languages',
    price: 1,
    route: '/dashboard/ai-tools/translator',
  },
  {
    id: 'html-to-text',
    name: 'HTML to Text',
    description: 'Convert HTML code to plain text',
    category: 'ai-tools',
    icon: 'Code',
    price: 1,
    route: '/dashboard/ai-tools/html-to-text',
  },
  {
    id: 'text-to-html',
    name: 'Text to HTML',
    description: 'Convert plain text to HTML format',
    category: 'ai-tools',
    icon: 'FileText',
    price: 1,
    route: '/dashboard/ai-tools/text-to-html',
  },
  {
    id: 'pdf-to-html',
    name: 'PDF to HTML',
    description: 'Convert PDF documents to HTML',
    category: 'ai-tools',
    icon: 'FileText',
    price: 1,
    route: '/dashboard/ai-tools/pdf-to-html',
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words and characters in your text',
    category: 'ai-tools',
    icon: 'Hash',
    price: 0, // Free tool (no purchase needed, but requires credits)
    route: '/dashboard/ai-tools/word-counter',
    isFree: true,
  },
  {
    id: 'character-counter',
    name: 'Character Counter',
    description: 'Count characters, words, and paragraphs',
    category: 'ai-tools',
    icon: 'Type',
    price: 0, // Free tool (no purchase needed, but requires credits)
    route: '/dashboard/ai-tools/character-counter',
    isFree: true,
  },

  // Summarizer
  {
    id: 'summarizer',
    name: 'Summarizer',
    description: 'Summarize text, PDFs, Word docs, YouTube videos, and images',
    category: 'summarizer',
    icon: 'ScrollText',
    price: 1,
    route: '/dashboard/summarizer',
  },

  // Chat
  {
    id: 'ask-ai',
    name: 'Ask AI',
    description: 'Chat with GPT-4o, DeepSeek, and Gemini AI models',
    category: 'chat',
    icon: 'MessageSquare',
    price: 0, // Free tool (no purchase needed, but requires credits)
    route: '/dashboard/ask-ai',
    isFree: true,
  },

  // Homework & Math
  {
    id: 'ai-homework-helper',
    name: 'AI Homework Helper',
    description: 'Get help with homework across multiple subjects',
    category: 'homework',
    icon: 'BookOpen',
    price: 1,
    route: '/dashboard/ai-homework-helper',
  },
  {
    id: 'ai-math-solver',
    name: 'AI Math Solver',
    description: 'Solve math problems with step-by-step solutions',
    category: 'math',
    icon: 'Calculator',
    price: 1,
    route: '/dashboard/ai-math-solver',
  },

  // Coding Tools (Purchasable)
  {
    id: 'code-translator',
    name: 'AI Code Translator',
    description: 'Instantly translate code between 50+ programming languages',
    category: 'coding',
    icon: 'Code2',
    price: 1,
    route: '/dashboard/coding/translator',
  },
  {
    id: 'ai-lessons',
    name: 'AI Lessons',
    description: 'Generate personalized programming lessons with AI',
    category: 'coding',
    icon: 'GraduationCap',
    price: 1,
    route: '/dashboard/coding/lessons',
  },
  {
    id: 'ai-practice',
    name: 'AI Practice Challenges',
    description: 'Practice coding with AI-generated challenges and feedback',
    category: 'coding',
    icon: 'Terminal',
    price: 1,
    route: '/dashboard/coding/practice',
  },
  {
    id: 'ai-tutor',
    name: 'AI Coding Tutor',
    description: 'Get 24/7 help with debugging and coding concepts',
    category: 'coding',
    icon: 'UserCog',
    price: 1,
    route: '/dashboard/coding/tutor',
  },
];

// Get tools by category
export const getToolsByCategory = (category: string) => {
  return ALL_TOOLS.filter(tool => tool.category === category);
};

// Get purchasable tools (exclude free tools)
export const getPurchasableTools = () => {
  return ALL_TOOLS.filter(tool => tool.price > 0 && !tool.isFree);
};

// Get free tools (no purchase needed, but require credits)
export const getFreeTools = () => {
  return ALL_TOOLS.filter(tool => tool.isFree === true);
};

// Get tool by ID
export const getToolById = (id: string) => {
  return ALL_TOOLS.find(tool => tool.id === id);
};

