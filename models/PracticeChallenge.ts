import mongoose, { Schema, Document } from 'mongoose';

export interface IPracticeChallenge extends Document {
    userId: string;
    folderId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    language: string;
    difficulty: string;
    codeTemplate: string;
    solutionCode: string;
    testCases: Array<{ input: string, output: string, description: string }>;
    timeLimit: string;
    points: number;
    completed: boolean;
    isAiGenerated: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PracticeChallengeSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'PracticeFolder', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    language: { type: String, required: true },
    difficulty: { type: String, required: true },
    codeTemplate: { type: String, required: true },
    solutionCode: { type: String, required: true },
    testCases: [{
        input: String,
        output: String,
        description: String
    }],
    timeLimit: { type: String, default: '30 min' },
    points: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    isAiGenerated: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.PracticeChallenge || mongoose.model<IPracticeChallenge>('PracticeChallenge', PracticeChallengeSchema);
