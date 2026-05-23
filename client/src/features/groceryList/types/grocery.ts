export type Category =
  | 'Produce'
  | 'Dairy'
  | 'Meat'
  | 'Poultry'
  | 'Seafood'
  | 'Bakery'
  | 'Pasta and Rice'
  | 'Canned and Jarred'
  | 'Frozen'
  | 'Beverages'
  | 'Baking'
  | 'Spices and Seasonings'
  | 'Oil, Vinegar, Salad Dressing'
  | 'Condiments'
  | 'Snacks'
  | 'Cereal'
  | 'Health Foods'
  | 'Other';

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  inventoryQuantity: number;
  category: Category;
  checked: boolean;
  recipeCount: number;
}

export interface GroceryItemGroup {
  category: Category;
  count: number;
  items: GroceryItem[];
}
