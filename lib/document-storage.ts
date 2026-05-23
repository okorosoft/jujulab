import connectMongoDB from './mongodb';
import DocumentModel, { IDocument } from './models/Document';

import { DocumentType } from './models/Document';
import Lesson from '@/models/Lesson';
import PracticeChallenge from '@/models/PracticeChallenge';
import Conversation from '@/models/Conversation';

export interface DocumentRecord {
  id: string;
  userId: string;
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
  undetectableId?: string;
  toolMetadata?: Record<string, any>;
}

export class DocumentStorage {
  static async createDocument(
    userId: string,
    documentData: Omit<DocumentRecord, 'id' | 'userId' | 'createdAt'>
  ): Promise<DocumentRecord> {
    try {
      await connectMongoDB();

      // Convert toolMetadata object to Map if provided
      const docData: any = {
        ...documentData,
        userId,
      };

      if (documentData.toolMetadata) {
        docData.toolMetadata = new Map(Object.entries(documentData.toolMetadata));
      }

      const document = new DocumentModel(docData);
      const savedDocument = await document.save();

      // Handle toolMetadata conversion safely
      let toolMetadata: Record<string, any> | undefined = undefined;

      if (savedDocument.toolMetadata) {
        if (savedDocument.toolMetadata instanceof Map) {
          try {
            toolMetadata = Object.fromEntries(savedDocument.toolMetadata);
          } catch (e) {
            // If conversion fails, convert manually
            toolMetadata = {};
            savedDocument.toolMetadata.forEach((value: any, key: string) => {
              toolMetadata![key] = value;
            });
          }
        } else if (typeof savedDocument.toolMetadata === 'object' && savedDocument.toolMetadata !== null) {
          // Already an object, use it directly
          toolMetadata = savedDocument.toolMetadata as Record<string, any>;
        }
      }

      return {
        id: savedDocument.id,
        userId: savedDocument.userId,
        type: savedDocument.type,
        title: savedDocument.title,
        input: savedDocument.input,
        output: savedDocument.output,
        createdAt: savedDocument.createdAt.toISOString(),
        status: savedDocument.status,
        wordCount: savedDocument.wordCount,
        purpose: savedDocument.purpose,
        readability: savedDocument.readability,
        strength: savedDocument.strength,
        aiProbability: savedDocument.aiProbability,
        humanProbability: savedDocument.humanProbability,
        confidence: savedDocument.confidence,
        fileName: savedDocument.fileName,
        undetectableId: savedDocument.undetectableId,
        toolMetadata,
      };
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  static async getDocumentsByUser(userId: string): Promise<DocumentRecord[]> {
    try {
      await connectMongoDB();

      const documents = await DocumentModel.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      return documents.map((doc: any) => {
        // Handle toolMetadata conversion safely
        let toolMetadata: Record<string, any> | undefined = undefined;

        if (doc.toolMetadata) {
          // If it's already a plain object (from .lean()), use it directly
          if (doc.toolMetadata instanceof Map) {
            try {
              toolMetadata = Object.fromEntries(doc.toolMetadata);
            } catch (e) {
              // If conversion fails, try to convert manually
              toolMetadata = {};
              doc.toolMetadata.forEach((value: any, key: string) => {
                toolMetadata![key] = value;
              });
            }
          } else if (typeof doc.toolMetadata === 'object' && doc.toolMetadata !== null) {
            // Already an object, use it directly
            toolMetadata = doc.toolMetadata;
          }
        }

        return {
          id: doc._id.toString(),
          userId: doc.userId,
          type: doc.type,
          title: doc.title,
          input: doc.input,
          output: doc.output,
          createdAt: doc.createdAt.toISOString(),
          status: doc.status,
          wordCount: doc.wordCount,
          purpose: doc.purpose,
          readability: doc.readability,
          strength: doc.strength,
          aiProbability: doc.aiProbability,
          humanProbability: doc.humanProbability,
          confidence: doc.confidence,
          fileName: doc.fileName,
          undetectableId: doc.undetectableId,
          toolMetadata,
        };
      });
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  static async getDocumentById(id: string, userId: string): Promise<DocumentRecord | null> {
    try {
      await connectMongoDB();

      const document = await DocumentModel.findOne({
        _id: id,
        userId,
      }).lean();

      if (!document) {
        return null;
      }

      return {
        id: document._id.toString(),
        userId: document.userId,
        type: document.type,
        title: document.title,
        input: document.input,
        output: document.output,
        createdAt: document.createdAt.toISOString(),
        status: document.status,
        wordCount: document.wordCount,
        purpose: document.purpose,
        readability: document.readability,
        strength: document.strength,
        aiProbability: document.aiProbability,
        humanProbability: document.humanProbability,
        confidence: document.confidence,
        fileName: document.fileName,
        undetectableId: document.undetectableId,
      };
    } catch (error) {
      console.error('Error getting document by ID:', error);
      throw error;
    }
  }

  static async updateDocument(
    id: string,
    userId: string,
    updates: Partial<DocumentRecord>
  ): Promise<DocumentRecord | null> {
    try {
      await connectMongoDB();

      const document = await DocumentModel.findOneAndUpdate(
        { _id: id, userId },
        { $set: updates },
        { new: true, lean: true }
      );

      if (!document) {
        return null;
      }

      return {
        id: document._id.toString(),
        userId: document.userId,
        type: document.type,
        title: document.title,
        input: document.input,
        output: document.output,
        createdAt: document.createdAt.toISOString(),
        status: document.status,
        wordCount: document.wordCount,
        purpose: document.purpose,
        readability: document.readability,
        strength: document.strength,
        aiProbability: document.aiProbability,
        humanProbability: document.humanProbability,
        confidence: document.confidence,
        fileName: document.fileName,
        undetectableId: document.undetectableId,
      };
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  static async deleteDocument(id: string, userId: string): Promise<boolean> {
    try {
      await connectMongoDB();

      const result = await DocumentModel.deleteOne({
        _id: id,
        userId,
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  static async getUserUsageStats(userId: string): Promise<{
    totalDocuments: number;
    totalWords: number;
    humanizeCount: number;
    detectCount: number;
    thisMonthWords: number;
    toolBreakdown: Record<string, { count: number; words: number }>;
  }> {
    try {
      await connectMongoDB();

      // Use MongoDB aggregation for better performance
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [stats, thisMonthStats, toolStats] = await Promise.all([
        // Overall stats
        DocumentModel.aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              totalDocuments: { $sum: 1 },
              totalWords: { $sum: { $ifNull: ['$wordCount', 0] } },
              humanizeCount: {
                $sum: { $cond: [{ $eq: ['$type', 'humanize'] }, 1, 0] }
              },
              detectCount: {
                $sum: { $cond: [{ $eq: ['$type', 'detect'] }, 1, 0] }
              }
            }
          }
        ]),
        // This month stats
        DocumentModel.aggregate([
          {
            $match: {
              userId,
              createdAt: { $gte: thisMonth }
            }
          },
          {
            $group: {
              _id: null,
              thisMonthWords: { $sum: { $ifNull: ['$wordCount', 0] } }
            }
          }
        ]),
        // Tool breakdown stats (all tools)
        DocumentModel.aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              words: { $sum: { $ifNull: ['$wordCount', 0] } }
            }
          }
        ])
      ]);

      const overallStats = stats[0] || {
        totalDocuments: 0,
        totalWords: 0,
        humanizeCount: 0,
        detectCount: 0
      };

      const monthStats = thisMonthStats[0] || { thisMonthWords: 0 };

      // Convert tool stats array to object
      const toolBreakdown: Record<string, { count: number; words: number }> = {};
      toolStats.forEach((stat: any) => {
        if (stat._id) {
          toolBreakdown[stat._id] = {
            count: stat.count || 0,
            words: stat.words || 0
          };
        }
      });

      // Fetch Coding Tools Stats in parallel
      const [lessonStats, practiceStats, tutorStats] = await Promise.all([
        Lesson.aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              words: { $sum: { $add: [{ $strLenCP: "$content" }, { $strLenCP: "$description" }] } }
            }
          }
        ]),
        PracticeChallenge.aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              words: { $sum: { $add: [{ $strLenCP: "$description" }, { $strLenCP: "$solutionCode" }] } }
            }
          }
        ]),
        Conversation.aggregate([
          { $match: { userId } },
          { $unwind: "$messages" },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              words: { $sum: { $strLenCP: "$messages.content" } }
            }
          }
        ])
      ]);

      const lessons = lessonStats[0] || { count: 0, words: 0 };
      const practices = practiceStats[0] || { count: 0, words: 0 };
      const tutors = tutorStats[0] || { count: 0, words: 0 };

      // Approximation: 5 characters per word
      const lessonWords = Math.round(lessons.words / 5);
      const practiceWords = Math.round(practices.words / 5);
      const tutorWords = Math.round(tutors.words / 5);

      // Add to tool breakdown
      if (lessons.count > 0) toolBreakdown['ai-lessons'] = { count: lessons.count, words: lessonWords };
      if (practices.count > 0) toolBreakdown['ai-practice'] = { count: practices.count, words: practiceWords };
      if (tutors.count > 0) toolBreakdown['ai-tutor'] = { count: tutors.count, words: tutorWords };

      return {
        totalDocuments: overallStats.totalDocuments + lessons.count + practices.count,
        totalWords: overallStats.totalWords + lessonWords + practiceWords + tutorWords,
        humanizeCount: overallStats.humanizeCount,
        detectCount: overallStats.detectCount,
        thisMonthWords: monthStats.thisMonthWords + lessonWords + practiceWords + tutorWords, // Simplified month stats
        toolBreakdown,
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw error;
    }
  }
}

// Helper function to get word count from text
export function getWordCount(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

// Helper function to generate document title
export function generateDocumentTitle(type: 'humanize' | 'detect', input: string): string {
  const prefix = type === 'humanize' ? 'AI Humanized' : 'AI Detected';
  const preview = input.substring(0, 50).trim();
  const suffix = input.length > 50 ? '...' : '';

  return `${prefix} - ${preview}${suffix}`;
}
