import type { Allergies, DietaryPreferences } from '../../../shared';
import type { Options } from './optionsTypes';

export const dietaryOptions: Options<keyof DietaryPreferences> = [
  { id: 'glutenFree', label: 'Gluten Free' },
  { id: 'ketogenic', label: 'Ketogenic' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'lactoVegetarian', label: 'Lacto-Vegetarian' },
  { id: 'ovoVegetarian', label: 'Ovo Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescetarian' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'primal', label: 'Primal' },
  { id: 'lowFODMAP', label: 'Low FODMAP' },
  { id: 'whole30', label: 'Whole30' },
];

export const allergiesOptions: Options<keyof Allergies> = [
  { id: 'nuts', label: 'Nuts' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'gluten', label: 'Gluten' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'soy', label: 'Soy' },
];

export const goalsOptions: Options<string> = [
  { id: 'lose_weight', label: 'Lose Weight' },
  { id: 'gain_muscle', label: 'Gain Muscle' },
  { id: 'eat_healthier', label: 'Eat Healthier' },
  { id: 'maintain_weight', label: 'Maintain Weight' },
];
