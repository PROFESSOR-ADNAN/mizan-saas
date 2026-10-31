import mongoose, { Schema, Document } from 'mongoose';

export interface CounterDocument extends Document {
  _id: any;
  seq: number;
}

const CounterSchema = new Schema<CounterDocument>(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
  }
);

export const CounterModel = mongoose.model<CounterDocument>('Counter', CounterSchema);

export async function getNextSequence(counterId: string, session?: mongoose.ClientSession): Promise<number> {
  const result = await CounterModel.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  return result ? result.seq : 1;
}
