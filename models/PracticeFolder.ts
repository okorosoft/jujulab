import mongoose, { Schema, Document } from 'mongoose';

export interface IPracticeFolder extends Document {
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const PracticeFolderSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.PracticeFolder || mongoose.model<IPracticeFolder>('PracticeFolder', PracticeFolderSchema);
