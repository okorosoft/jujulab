import mongoose, { Schema, Document } from 'mongoose';

export interface ILessonProgress extends Document {
    userId: string;
    lessonId: mongoose.Types.ObjectId;
    code: string;
    completed: boolean;
    progress: number;
    attempts: number;
    createdAt: Date;
    updatedAt: Date;
}

const LessonProgressSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    code: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.LessonProgress || mongoose.model<ILessonProgress>('LessonProgress', LessonProgressSchema);
