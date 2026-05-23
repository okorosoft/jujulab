import mongoose, { Schema, Model } from 'mongoose';
import connectMongoDB from '../mongodb';

export type DocumentType = 'humanize' | 'detect' | 'grammar-check' | 'spell-check' | 'plagiarism-check' | 'translator' | 'html-to-text' | 'text-to-html' | 'pdf-to-html' | 'word-counter' | 'character-counter' | 'summarizer-text' | 'summarizer-pdf' | 'summarizer-word' | 'summarizer-youtube' | 'summarizer-image' | 'ai-homework-helper' | 'ai-math-solver' | 'ask-ai' | 'ai-image-detection' | 'ai-video-detection';

export interface IDocument {
  id: string;
  userId: string;
  type: DocumentType;
  title: string;
  input: string;
  output?: string;
  createdAt: Date;
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
  toolMetadata?: Record<string, any>; // For storing tool-specific metadata
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    input: {
      type: String,
      required: true,
    },
    output: {
      type: String,
      default: undefined,
    },
    status: {
      type: String,
      enum: ['completed', 'processing', 'failed'],
      default: 'processing',
    },
    wordCount: {
      type: Number,
      required: true,
    },
    purpose: String,
    readability: String,
    strength: String,
    aiProbability: Number,
    humanProbability: Number,
    confidence: Number,
    fileName: String,
    undetectableId: String,
    toolMetadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ type: 1 });
DocumentSchema.index({ status: 1 });

// Create a virtual id that matches the actual _id
DocumentSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtual fields are serialized
DocumentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    const { _id, __v, ...rest } = ret as any;
    return rest;
  },
});

// Delete existing model if it exists to avoid schema caching issues
if (mongoose.models.Document) {
  delete mongoose.models.Document;
}

const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);

export default DocumentModel;

