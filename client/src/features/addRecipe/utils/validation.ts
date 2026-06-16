import type { InitialRecipeForm } from '../types/addRecipe';

export function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function isOptionalStringNonNegativeNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return isNonNegativeNumber(Number(trimmed));
}

export function validateRecipeForm(form: InitialRecipeForm): string | null {
  if (!form.name.trim()) {
    return 'Recipe name is required.';
  }

  if (!isOptionalStringNonNegativeNumber(form.servings)) {
    return 'Servings must be a non-negative number.';
  }

  if (!isOptionalStringNonNegativeNumber(form.readyInMinutes)) {
    return 'Ready in minutes must be a non-negative number.';
  }

  const invalidIngredientAmount = form.ingredients.some((ing) => {
    if (!ing.name || !ing.name.trim()) return false;
    return !isNonNegativeNumber(Number(ing.amount));
  });

  if (invalidIngredientAmount) {
    return 'All ingredient amounts must be non-negative numbers.';
  }

  return null;
}
