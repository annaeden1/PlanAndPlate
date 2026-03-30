import type { DietaryPreferences } from "../../../shared";

export const dietaryOptions: { id: keyof DietaryPreferences; label: string }[] = [
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