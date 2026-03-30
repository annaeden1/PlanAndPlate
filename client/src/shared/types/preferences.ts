export interface DietaryPreferences {
  glutenFree: boolean;
  ketogenic: boolean;
  vegetarian: boolean;
  lactoVegetarian: boolean;
  ovoVegetarian: boolean;
  vegan: boolean;
  pescatarian: boolean;
  paleo: boolean;
  primal: boolean;
  lowFODMAP: boolean;
  whole30: boolean;
}

export interface Allergies {
  nuts: boolean;
  dairy: boolean;
  gluten: boolean;
  shellfish: boolean;
  eggs: boolean;
  soy: boolean;
}