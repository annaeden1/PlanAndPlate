export type MatchStatus = 'match' | 'mismatch' | 'unknown';

export type SupportedDiet =
  | 'vegan'
  | 'vegetarian'
  | 'pescatarian'
  | 'glutenFree'
  | 'lactoVegetarian'
  | 'ovoVegetarian';

export type VegetarianVariant =
  | 'vegetarian'
  | 'lactoVegetarian'
  | 'ovoVegetarian';

export interface ProductMatchContext {
  text: string;
  confirmedAllergenText: string;
  potentialAllergenRiskText: string;
  tags: string[];
}

export interface UserPreferences {
  diet?: string[];
  allergies?: string[];
  healthGoal?: string;
}

export interface PreferenceMatch {
  label: string;
  status: MatchStatus;
}
