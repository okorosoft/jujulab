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

    // Get recent activities from all collections
    const [docs, lessons, practices, tutors] = await Promise.all([
      DocumentModel.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      Lesson.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      PracticeChallenge.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      Conversation.find({ userId }).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    // Format all activities to match RecentActivity interface
    const allActivities: any[] = [
      ...docs.map((doc: any) => ({
        toolId: doc.type,
        toolName: getToolName(doc.type),
        category: TOOL_CATEGORIES[doc.type]?.name || 'Other',
        wordsProcessed: doc.wordCount || 0,
        timestamp: doc.createdAt
      })),
      ...lessons.map((doc: any) => ({
        toolId: 'ai-lessons',
        toolName: 'AI Lessons',
        category: 'Coding Tools',
        wordsProcessed: Math.round(((doc.content?.length || 0) + (doc.description?.length || 0)) / 5),
        timestamp: doc.createdAt
      })),
      ...practices.map((doc: any) => ({
        toolId: 'ai-practice',
        toolName: 'AI Practice',
        category: 'Coding Tools',
        wordsProcessed: Math.round(((doc.description?.length || 0) + (doc.solutionCode?.length || 0)) / 5),
        timestamp: doc.createdAt
      })),
      ...tutors.map((doc: any) => {
        const lastMsg = doc.messages[doc.messages.length - 1];
        return {
          toolId: 'ai-tutor',
          toolName: 'AI Coding Tutor',
          category: 'Coding Tools',
          wordsProcessed: Math.round((lastMsg?.content?.length || 0) / 5),
          timestamp: doc.updatedAt || doc.createdAt
        };
      })
    ];

    // Sort combined activities by timestamp and limit to 10
    const activities = allActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
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

