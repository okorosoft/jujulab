import mongoose, { Schema, Document } from 'mongoose';

export interface ILesson extends Document {
    userId: string;
    title: string;
    description: string;
    language: string;
    difficulty: string;
    duration: string;
    content: string;
    codeTemplate: string;
    expectedOutput: string;
    hints: string[];
    completed: boolean;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
}

const LessonSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    language: { type: String, required: true },
    difficulty: { type: String, required: true },
    duration: { type: String, required: true },
    content: { type: String, required: true },
    codeTemplate: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    hints: { type: [String], default: [] },
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);
