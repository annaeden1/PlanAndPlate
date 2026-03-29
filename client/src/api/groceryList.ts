import axios from 'axios';
import type { IGroceryItem, IGroceryItemGroup } from '../types/grocery';

const api = axios.create({
  baseURL: '/grocerylist',
  headers: { 'Content-Type': 'application/json' },
});

export const groceryListApi = {
  getAll: (userId: string) =>
    api.get<IGroceryItemGroup[]>(`/users/${userId}/products`).then((r) => r.data),

  addProduct: (
    userId: string,
    item: { name: string; quantity: number; unit: string; aisle?: string },
  ) =>
    api.post<IGroceryItemGroup[]>(`/users/${userId}/products`, item).then((r) => r.data),

  removeProduct: (userId: string, productName: string) =>
    api
      .delete<IGroceryItemGroup[]>(`/users/${userId}/products/${encodeURIComponent(productName)}`)
      .then((r) => r.data),

  removeBoughtItems: (userId: string, names: string[]) =>
    api
      .delete<IGroceryItemGroup[]>(`/users/${userId}/products/bought`, { data: { names } })
      .then((r) => r.data),

  clearList: (userId: string) =>
    api.delete(`/users/${userId}/products`),

  importRecipe: (userId: string, recipeId: string, mealPlanId?: string) =>
    api
      .post<IGroceryItemGroup[]>(`/users/${userId}/recipes/${recipeId}/ingredients`, { mealPlanId })
      .then((r) => r.data),

  searchProducts: (userId: string, name: string) =>
    api
      .get<IGroceryItem[]>(`/users/${userId}/products/search`, { params: { name } })
      .then((r) => r.data),
};
