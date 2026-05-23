// Tool usage tracking utility
// Uses localStorage for client-side tracking (can be migrated to DB later)
//
// Usage in tool pages:
// import { trackToolUsage } from '@/lib/tool-usage-tracker';
// 
// After successful tool execution:
// trackToolUsage('grammar-check', 'Grammar Check', wordCount);
// trackToolUsage('spell-check', 'Spell Check', wordCount);
// etc.

export interface ToolUsage {
  toolId: string;
  toolName: string;
  category: string;
  count: number;
  wordsProcessed: number;
  lastUsed: string;
}

export interface RecentActivity {
  toolId: string;
  toolName: string;
  category: string;
  wordsProcessed: number;
  timestamp: string;
}

const STORAGE_KEY = 'tool_usage_stats';
const RECENT_ACTIVITY_KEY = 'recent_tool_activity';
const MAX_RECENT_ACTIVITIES = 10;

// Tool categories mapping
export const TOOL_CATEGORIES: Record<string, { name: string; color: string; icon: string }> = {
  'humanize': { name: 'Humanization', color: '#3b82f6', icon: 'brain' },
  'detect': { name: 'Detection', color: '#8b5cf6', icon: 'target' },
  'grammar-check': { name: 'Writing Tools', color: '#10b981', icon: 'spell-check' },
  'spell-check': { name: 'Writing Tools', color: '#10b981', icon: 'spell-check' },
  'plagiarism-check': { name: 'Writing Tools', color: '#10b981', icon: 'spell-check' },
  'translator': { name: 'Translation', color: '#f59e0b', icon: 'languages' },
  'html-to-text': { name: 'Conversion Tools', color: '#ef4444', icon: 'code' },
  'text-to-html': { name: 'Conversion Tools', color: '#ef4444', icon: 'code' },
  'pdf-to-html': { name: 'Conversion Tools', color: '#ef4444', icon: 'code' },
  'summarizer': { name: 'Summarizer', color: '#06b6d4', icon: 'file-text' },
  'ai-homework-helper': { name: 'AI Homework Helper', color: '#8b5cf6', icon: 'book' },
  'ask-ai': { name: 'AI Chat', color: '#ec4899', icon: 'message-square' },
  'ai-math-solver': { name: 'AI Math Solver', color: '#6366f1', icon: 'calculator' },
  'ai-image-detection': { name: 'AI Image Detection', color: '#f59e0b', icon: 'eye' },
  'ai-video-detection': { name: 'AI Video Detection', color: '#ef4444', icon: 'video' },
  'summarizer-text': { name: 'Summarizer', color: '#06b6d4', icon: 'file-text' },
  'summarizer-pdf': { name: 'Summarizer', color: '#06b6d4', icon: 'file-text' },
  'summarizer-word': { name: 'Summarizer', color: '#06b6d4', icon: 'file-text' },
  'summarizer-youtube': { name: 'Summarizer', color: '#06b6d4', icon: 'file-text' },
  'summarizer-image': { name: 'Summarizer', color: '#06b6d4', icon: 'file-text' },
  'code-translator': { name: 'Coding Tools', color: '#10b981', icon: 'code' },
  'ai-lessons': { name: 'Coding Tools', color: '#10b981', icon: 'graduation-cap' },
  'ai-practice': { name: 'Coding Tools', color: '#10b981', icon: 'terminal' },
  'ai-tutor': { name: 'Coding Tools', color: '#10b981', icon: 'user-cog' },
};

export function trackToolUsage(toolId: string, toolName: string, wordsProcessed: number = 0) {
  if (typeof window === 'undefined') return;

  try {
    // Get current usage stats
    const stored = localStorage.getItem(STORAGE_KEY);
    const usage: Record<string, ToolUsage> = stored ? JSON.parse(stored) : {};

    // Update or create tool usage
    if (!usage[toolId]) {
      usage[toolId] = {
        toolId,
        toolName,
        category: TOOL_CATEGORIES[toolId]?.name || 'Other',
        count: 0,
        wordsProcessed: 0,
        lastUsed: new Date().toISOString(),
      };
    }

    usage[toolId].count += 1;
    usage[toolId].wordsProcessed += wordsProcessed;
    usage[toolId].lastUsed = new Date().toISOString();

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));

    // Add to recent activity
    const recentStored = localStorage.getItem(RECENT_ACTIVITY_KEY);
    const recentActivities: RecentActivity[] = recentStored ? JSON.parse(recentStored) : [];

    recentActivities.unshift({
      toolId,
      toolName,
      category: TOOL_CATEGORIES[toolId]?.name || 'Other',
      wordsProcessed,
      timestamp: new Date().toISOString(),
    });

    // Keep only last MAX_RECENT_ACTIVITIES
    const trimmed = recentActivities.slice(0, MAX_RECENT_ACTIVITIES);
    localStorage.setItem(RECENT_ACTIVITY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error tracking tool usage:', error);
  }
}

export function getToolUsageStats(): ToolUsage[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const usage: Record<string, ToolUsage> = JSON.parse(stored);
    return Object.values(usage).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting tool usage stats:', error);
    return [];
  }
}

export function getRecentActivities(): RecentActivity[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(RECENT_ACTIVITY_KEY);
    if (!stored) return [];

    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
}

export function getMostUsedTool(): ToolUsage | null {
  const stats = getToolUsageStats();
  return stats.length > 0 ? stats[0] : null;
}

export function getToolUsageByCategory(): Record<string, { count: number; wordsProcessed: number }> {
  const stats = getToolUsageStats();
  const byCategory: Record<string, { count: number; wordsProcessed: number }> = {};

  stats.forEach(tool => {
    if (!byCategory[tool.category]) {
      byCategory[tool.category] = { count: 0, wordsProcessed: 0 };
    }
    byCategory[tool.category].count += tool.count;
    byCategory[tool.category].wordsProcessed += tool.wordsProcessed;
  });

  return byCategory;
}

