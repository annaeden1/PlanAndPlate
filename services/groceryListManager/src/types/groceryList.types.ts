import { Category } from './categories';

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  category: Category;
}

export interface GroceryItemGroup {
  category: Category;
  count: number;
  items: GroceryItem[];
}
