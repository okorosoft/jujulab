import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import DocumentModel from '@/lib/models/Document';
import connectMongoDB from '@/lib/mongodb';
import { TOOL_CATEGORIES } from '@/lib/tool-usage-tracker';
import Lesson from '@/models/Lesson';
import PracticeChallenge from '@/models/PracticeChallenge';
import Conversation from '@/models/Conversation';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongoDB();

    // Get tool usage stats from database
    // Get tool usage stats from all collections
    const [docStats, lessonStats, practiceStats, tutorStats] = await Promise.all([
      DocumentModel.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            wordsProcessed: { $sum: { $ifNull: ['$wordCount', 0] } },
            lastUsed: { $max: '$createdAt' }
          }
        }
      ]),
      Lesson.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: { $literal: 'ai-lessons' },
            count: { $sum: 1 },
            wordsProcessed: { $sum: { $add: [{ $strLenCP: "$content" }, { $strLenCP: "$description" }] } },
            lastUsed: { $max: '$createdAt' }
          }
        }
      ]),
      PracticeChallenge.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: { $literal: 'ai-practice' },
            count: { $sum: 1 },
            wordsProcessed: { $sum: { $add: [{ $strLenCP: "$description" }, { $strLenCP: "$solutionCode" }] } },
            lastUsed: { $max: '$createdAt' }
          }
        }
      ]),
      Conversation.aggregate([
        { $match: { userId } },
        { $unwind: "$messages" },
        {
          $group: {
            _id: { $literal: 'ai-tutor' },
            count: { $sum: 1 },
            wordsProcessed: { $sum: { $strLenCP: "$messages.content" } },
            lastUsed: { $max: '$createdAt' }
          }
        }
      ])
    ]);

    // Merge all stats
    const combinedStats = [...docStats];

    // Process coding tool stats (convert char count to words)
    [lessonStats[0], practiceStats[0], tutorStats[0]].forEach(stat => {
      if (stat) {
        combinedStats.push({
          ...stat,
          wordsProcessed: Math.round(stat.wordsProcessed / 5)
        });
      }
    });

    // Transform to match ToolUsage interface
    const usage: Array<{
      toolId: string;
      toolName: string;
      category: string;
      count: number;
      wordsProcessed: number;
      lastUsed: string;
    }> = combinedStats.map((stat: any) => {
      const toolId = stat._id;
      const toolName = getToolName(toolId);
      const category = TOOL_CATEGORIES[toolId]?.name || 'Other';

      return {
        toolId,
        toolName,
        category,
        count: stat.count || 0,
        wordsProcessed: stat.wordsProcessed || 0,
        lastUsed: stat.lastUsed ? new Date(stat.lastUsed).toISOString() : new Date().toISOString(),
      };
    });

    // Sort by count descending
    const sortedUsage = usage.sort((a, b) => b.count - a.count);

    return NextResponse.json({ usage: sortedUsage });
  } catch (error: any) {
    console.error('Error fetching tool usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool usage stats' },
      { status: 500 }
    );
  }
}

function getToolName(toolId: string): string {
  const toolNames: Record<string, string> = {
    'humanize': 'AI Humanize',
    'detect': 'AI Detector',
    'grammar-check': 'Grammar Check',
    'spell-check': 'Spell Check',
    'plagiarism-check': 'Plagiarism Check',
    'translator': 'AI Translator',
    'html-to-text': 'HTML to Text',
    'text-to-html': 'Text to HTML',
    'pdf-to-html': 'PDF to HTML',
    'word-counter': 'Word Counter',
    'character-counter': 'Character Counter',
    'summarizer': 'Summarizer',
    'summarizer-text': 'Summarizer (Text)',
    'summarizer-pdf': 'Summarizer (PDF)',
    'summarizer-word': 'Summarizer (Word)',
    'summarizer-youtube': 'Summarizer (YouTube)',
    'summarizer-image': 'Summarizer (Image)',
    'ai-homework-helper': 'AI Homework Helper',
    'ai-math-solver': 'AI Math Solver',
    'ask-ai': 'Ask AI',
    'ai-image-detection': 'AI Image Detection',
    'ai-video-detection': 'AI Video Detection',
    'ai-lessons': 'AI Lessons',
    'ai-practice': 'AI Practice',
    'ai-tutor': 'AI Coding Tutor',
    'code-translator': 'AI Code Translator',
  };

  return toolNames[toolId] || toolId;
}

