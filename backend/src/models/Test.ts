import mongoose, { Document, Schema } from 'mongoose';

export interface ITest extends Document {
  title: string;
  value: number;
}

const TestSchema: Schema = new Schema({
  title: { type: String, required: true },
  value: { type: Number, required: true },
});

export default mongoose.model<ITest>('Test', TestSchema); 