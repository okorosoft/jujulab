import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DocumentStorage } from '@/lib/document-storage';
import { clerkClient } from '@clerk/nextjs/server';
import DocumentModel from '@/lib/models/Document';
import connectMongoDB from '@/lib/mongodb';
import Lesson from '@/models/Lesson';
import PracticeChallenge from '@/models/PracticeChallenge';
import Conversation from '@/models/Conversation';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Load all data in parallel for better performance
    const [usageStats, clerk] = await Promise.all([
      DocumentStorage.getUserUsageStats(userId),
      clerkClient().then(c => c.users.getUser(userId))
    ]);

    // REAL DATA from MongoDB
    const wordsProcessed = usageStats.totalWords; // From MongoDB
    const documentsCreated = usageStats.totalDocuments; // From MongoDB
    const timeSaved = Math.round(documentsCreated * 2.5); // Estimated based on real documents

    // Get image and video detection counts
    const imageDetectionCount = usageStats.toolBreakdown?.['ai-image-detection']?.count || 0;
    const videoDetectionCount = usageStats.toolBreakdown?.['ai-video-detection']?.count || 0;

    // Fetch historical data for different time ranges
    const now = new Date();

    // For monthly view, we need last 6 months of data (use UTC to match MongoDB dateToString)
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1));
    sixMonthsAgo.setUTCHours(0, 0, 0, 0);

    // Use MongoDB aggregation to get daily stats efficiently (last 6 months)
    await connectMongoDB();

    const dailyStats = await DocumentModel.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'UTC'
              }
            },
            type: '$type'
          },
          documents: { $sum: 1 },
          words: { $sum: { $ifNull: ['$wordCount', 0] } }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Create a map for quick lookup with type separation (now includes all tools)
    const statsMap = new Map<string, { documents: number; words: number; humanizeWords: number; detectWords: number; toolWords: Record<string, number> }>();

    dailyStats.forEach((stat: any) => {
      const dateKey = stat._id.date;
      const type = stat._id.type;
      const words = stat.words || 0;
      const documents = stat.documents || 0;

      if (!statsMap.has(dateKey)) {
        statsMap.set(dateKey, { documents: 0, words: 0, humanizeWords: 0, detectWords: 0, toolWords: {} });
      }

      const dayStats = statsMap.get(dateKey)!;
      dayStats.documents += documents;
      dayStats.words += words;

      // Track words by tool type
      if (!dayStats.toolWords[type]) {
        dayStats.toolWords[type] = 0;
      }
      dayStats.toolWords[type] += words;

      // Keep backward compatibility
      if (type === 'humanize') {
        dayStats.humanizeWords += words;
      } else if (type === 'detect') {
        dayStats.detectWords += words;
      }
    });

    // Generate daily data array for last 7 days (for daily view)
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setUTCDate(date.getUTCDate() - (6 - i));
      date.setUTCHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      const dayStats = statsMap.get(dateStr) || { documents: 0, words: 0, humanizeWords: 0, detectWords: 0, toolWords: {} };

      // Use local date for display
      const localDate = new Date(dateStr + 'T00:00:00Z');

      return {
        date: dateStr,
        day: localDate.toLocaleDateString('en-US', { weekday: 'short' }),
        documents: dayStats.documents,
        words: dayStats.words,
        humanizeWords: dayStats.humanizeWords || 0,
        detectWords: dayStats.detectWords || 0,
        toolWords: dayStats.toolWords || {},
      };
    });

    // Generate weekly data for last 4 weeks
    const weeklyStats = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setUTCDate(weekStart.getUTCDate() - (i * 7 + 6));
      weekStart.setUTCHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      weekEnd.setUTCHours(23, 59, 59, 999);

      let weekWords = 0;
      let weekDocs = 0;
      let weekHumanizeWords = 0;
      let weekDetectWords = 0;
      const weekToolWords: Record<string, number> = {};

      // Sum up all days in this week
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekStart);
        dayDate.setUTCDate(dayDate.getUTCDate() + d);
        const dateStr = dayDate.toISOString().split('T')[0];
        const dayStats = statsMap.get(dateStr) || { documents: 0, words: 0, humanizeWords: 0, detectWords: 0, toolWords: {} };
        weekWords += dayStats.words;
        weekDocs += dayStats.documents;
        weekHumanizeWords += dayStats.humanizeWords || 0;
        weekDetectWords += dayStats.detectWords || 0;

        // Aggregate tool words
        Object.keys(dayStats.toolWords || {}).forEach(toolType => {
          if (!weekToolWords[toolType]) {
            weekToolWords[toolType] = 0;
          }
          weekToolWords[toolType] += dayStats.toolWords[toolType];
        });
      }

      return {
        week: `Week ${4 - i}`,
        words: weekWords,
        documents: weekDocs,
        humanizeWords: weekHumanizeWords,
        detectWords: weekDetectWords,
        toolWords: weekToolWords,
      };
    });

    // Generate monthly data for last 6 months
    const monthlyStats = Array.from({ length: 6 }, (_, i) => {
      const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const monthStart = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
      const monthEnd = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0));
      monthEnd.setUTCHours(23, 59, 59, 999);

      let monthWords = 0;
      let monthDocs = 0;
      let monthHumanizeWords = 0;
      let monthDetectWords = 0;
      const monthToolWords: Record<string, number> = {};

      // Sum up all days in this month
      const daysInMonth = monthEnd.getUTCDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), d));
        const dateStr = dayDate.toISOString().split('T')[0];
        const dayStats = statsMap.get(dateStr) || { documents: 0, words: 0, humanizeWords: 0, detectWords: 0, toolWords: {} };
        monthWords += dayStats.words;
        monthDocs += dayStats.documents;
        monthHumanizeWords += dayStats.humanizeWords || 0;
        monthDetectWords += dayStats.detectWords || 0;

        // Aggregate tool words
        Object.keys(dayStats.toolWords || {}).forEach(toolType => {
          if (!monthToolWords[toolType]) {
            monthToolWords[toolType] = 0;
          }
          monthToolWords[toolType] += dayStats.toolWords[toolType];
        });
      }

      return {
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        words: monthWords,
        documents: monthDocs,
        humanizeWords: monthHumanizeWords,
        detectWords: monthDetectWords,
        toolWords: monthToolWords,
      };
    });

    // Calculate REAL changes - compare last 7 days vs previous 7 days
    const last7DaysWords = weeklyData.slice(-7).reduce((sum, day) => sum + day.words, 0);
    const previous7DaysWords = usageStats.thisMonthWords - last7DaysWords;

    const wordsChange = previous7DaysWords > 0
      ? (((last7DaysWords - previous7DaysWords) / previous7DaysWords) * 100)
      : last7DaysWords > 0 ? 100 : 0;

    const last7DaysDocs = weeklyData.slice(-7).reduce((sum, day) => sum + day.documents, 0);
    const previous7DaysDocs = documentsCreated - last7DaysDocs;

    const documentsChange = previous7DaysDocs > 0
      ? (((last7DaysDocs - previous7DaysDocs) / previous7DaysDocs) * 100)
      : last7DaysDocs > 0 ? 100 : 0;

    return NextResponse.json({
      metrics: {
        wordsProcessed,
        documentsCreated,
        timeSaved,
        imageDetectionCount,
        videoDetectionCount,
      },
      changes: {
        wordsPercent: wordsChange > 0 ? `+${wordsChange.toFixed(1)}%` : `${wordsChange.toFixed(1)}%`,
        documentsPercent: documentsChange > 0 ? `+${documentsChange.toFixed(1)}%` : `${documentsChange.toFixed(1)}%`,
        timePercent: documentsChange > 0 ? `+${(documentsChange * 0.5).toFixed(1)}%` : '0%',
      },
      weeklyData,
      weeklyStats,
      monthlyStats,
      breakdown: {
        humanize: usageStats.humanizeCount,
        detect: usageStats.detectCount,
        imageDetection: usageStats.toolBreakdown?.['ai-image-detection']?.count || 0,
        videoDetection: usageStats.toolBreakdown?.['ai-video-detection']?.count || 0,
        ...usageStats.toolBreakdown, // Include all tool breakdowns
        'ai-lessons': usageStats.toolBreakdown?.['ai-lessons']?.count || 0,
        'ai-practice': usageStats.toolBreakdown?.['ai-practice']?.count || 0,
        'ai-tutor': usageStats.toolBreakdown?.['ai-tutor']?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

