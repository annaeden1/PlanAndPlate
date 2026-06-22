export interface BodyStats {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel:
    | 'sedentary'
    | 'light'
    | 'moderate'
    | 'active'
    | 'very_active'
    | 'extra_active';
  unitSystem: 'metric' | 'us';
}

export interface PreferenceUpdate {
  diet?: string[];
  allergies?: string[];
  healthGoal?: string;
  bodyStats?: BodyStats;
}
