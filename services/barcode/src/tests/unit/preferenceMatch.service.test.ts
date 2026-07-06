import { checkPreferenceMatches } from '../../services/preferenceMatchService';
import { type ProductNutrition } from '../../utils/types/product';
import { describe, expect, it } from '@jest/globals';

describe('PreferenceMatchService - Unit Tests', () => {
  it('returns unknown for allergy when there is no product evidence', () => {
    const product: ProductNutrition = {};

    const result = checkPreferenceMatches(product, {
      allergies: ['nuts'],
    });

    expect(result).toEqual([{ label: 'nuts free', status: 'unknown' }]);
  });

  it('returns mismatch when allergen is explicitly present', () => {
    const product: ProductNutrition = {
      ingredients_text: 'Sugar, peanut butter, cocoa',
    };

    const result = checkPreferenceMatches(product, {
      allergies: ['nuts'],
    });

    expect(result).toEqual([{ label: 'nuts free', status: 'mismatch' }]);
  });

  it('returns match when explicit free-from allergen tag exists', () => {
    const product: ProductNutrition = {
      labels: 'Dairy-free snack',
      labels_tags: ['en:dairy-free'],
    };

    const result = checkPreferenceMatches(product, {
      allergies: ['dairy'],
    });

    expect(result).toEqual([{ label: 'dairy free', status: 'match' }]);
  });

  it('returns mismatch for vegan diet when animal-derived ingredients are present', () => {
    const product: ProductNutrition = {
      ingredients_text: 'Whole oats, milk powder, sugar',
      labels_tags: ['en:vegan'],
    };

    const result = checkPreferenceMatches(product, {
      diet: ['vegan'],
    });

    expect(result).toEqual([{ label: 'Vegan Compatible', status: 'mismatch' }]);
  });

  it('returns match for gluten-free diet when no-gluten claim exists', () => {
    const product: ProductNutrition = {
      labels: 'No gluten',
      labels_tags: ['en:no-gluten'],
    };

    const result = checkPreferenceMatches(product, {
      diet: ['glutenFree'],
    });

    expect(result).toEqual([
      { label: 'Gluten Free Compatible', status: 'match' },
    ]);
  });

  it('evaluates both allergies and the first supported diet preference', () => {
    const product: ProductNutrition = {
      ingredients_text: 'Soy protein isolate and tomato',
      labels_tags: ['en:vegetarian'],
    };

    const result = checkPreferenceMatches(product, {
      allergies: ['soy'],
      diet: ['vegetarian', 'vegan'],
    });

    expect(result).toEqual([
      { label: 'soy free', status: 'mismatch' },
      { label: 'Vegetarian Compatible', status: 'match' },
    ]);
  });
});
