import { ObjectId } from 'mongoose';

export type User = {
  _id?: ObjectId | string;
  email: string;
  passwordHash: string;
  name: string;
  image?: string;
  preferences: {
    diet: string[];
    allergies: string[];
    healthGoal: string;
    weeklyBudget: number;
  };
  tokens?: string[];
};
