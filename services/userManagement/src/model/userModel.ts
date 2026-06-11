import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  preferences: {
    diet: { type: [String] },
    allergies: { type: [String] },
    healthGoal: { type: String },
    weeklyBudget: { type: Number },
    bodyStats: {
      weightKg: { type: Number },
      heightCm: { type: Number },
      age: { type: Number },
      gender: { type: String }, // 'male' | 'female'
      activityLevel: { type: String }, // 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | 'extra_active'
      unitSystem: { type: String }, // 'metric' | 'us' (display only; stored values are metric)
    },
  },
  tokens: { type: [String] },
});

export type UserDocument = mongoose.InferSchemaType<typeof userSchema> &
  mongoose.Document;

export const user = mongoose.model<UserDocument>('User', userSchema);
