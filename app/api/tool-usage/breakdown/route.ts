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

    // Get tool usage stats from all collections
    const [docStats, lessonStats, practiceStats, tutorStats] = await Promise.all([
      DocumentModel.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            wordsProcessed: { $sum: { $ifNull: ['$wordCount', 0] } }
          }
        }
      ]),
      Lesson.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: { $literal: 'ai-lessons' },
            count: { $sum: 1 },
            wordsProcessed: { $sum: { $add: [{ $strLenCP: "$content" }, { $strLenCP: "$description" }] } }
          }
        }
      ]),
      PracticeChallenge.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: { $literal: 'ai-practice' },
            count: { $sum: 1 },
            wordsProcessed: { $sum: { $add: [{ $strLenCP: "$description" }, { $strLenCP: "$solutionCode" }] } }
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
            wordsProcessed: { $sum: { $strLenCP: "$messages.content" } }
          }
        }
      ])
    ]);

    // Combine all stats
    const combinedStats = [
      ...docStats,
      ...lessonStats.map((s: any) => ({ ...s, wordsProcessed: Math.round(s.wordsProcessed / 5) })),
      ...practiceStats.map((s: any) => ({ ...s, wordsProcessed: Math.round(s.wordsProcessed / 5) })),
      ...tutorStats.map((s: any) => ({ ...s, wordsProcessed: Math.round(s.wordsProcessed / 5) }))
    ];

    // Group by category
    const byCategory: Record<string, { count: number; wordsProcessed: number }> = {};

    combinedStats.forEach((stat: any) => {
      const toolId = stat._id;
      const category = TOOL_CATEGORIES[toolId]?.name || 'Other';

      if (!byCategory[category]) {
        byCategory[category] = { count: 0, wordsProcessed: 0 };
      }

      byCategory[category].count += stat.count || 0;
      byCategory[category].wordsProcessed += stat.wordsProcessed || 0;
    });

    return NextResponse.json({ breakdown: byCategory });
  } catch (error: any) {
    console.error('Error fetching tool usage breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool usage breakdown' },
      { status: 500 }
    );
  }
}

