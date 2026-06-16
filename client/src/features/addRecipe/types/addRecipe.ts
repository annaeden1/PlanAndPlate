export interface InitialRecipeForm {
  name: string;
  image: string;
  servings: string;
  readyInMinutes: string;
  instructions: string[];
  ingredients: {
    name: string;
    amount: string;
    unit: string;
    aisle: string;
  }[];
}

export type RecipeFormInputFields =
  | 'name'
  | 'image'
  | 'servings'
  | 'readyInMinutes';
