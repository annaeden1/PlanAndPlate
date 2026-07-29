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
    bodyStats: {
      weightKg: { type: Number, min: 0 },
      heightCm: { type: Number, min: 0 },
      age: { type: Number, min: 0 },
      gender: { type: String, enum: ['male', 'female'] },
      activityLevel: {
        type: String,
        enum: [
          'sedentary',
          'light',
          'moderate',
          'active',
          'very_active',
          'extra_active',
        ],
      },
      unitSystem: { type: String, enum: ['metric', 'us'] }, // display only; stored values are metric
    },
  },
  tokens: { type: [String] },
});

export type UserDocument = mongoose.InferSchemaType<typeof userSchema> &
  mongoose.Document;

export const user = mongoose.model<UserDocument>('User', userSchema);
