import axios from 'axios';
import type { GroceryItem, GroceryItemGroup } from '../types/grocery';

const api = axios.create({
  baseURL: '/grocerylist',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const groceryListApi = {
  getAll: (userId: string) =>
    api.get<GroceryItemGroup[]>(`/users/${userId}/products`).then((r) => r.data),

  addProduct: (
    userId: string,
    item: { name: string; quantity: number; unit: string; aisle?: string },
  ) =>
    api.post<GroceryItemGroup[]>(`/users/${userId}/products`, item).then((r) => r.data),

  removeProduct: (userId: string, productName: string) =>
    api
      .delete<GroceryItemGroup[]>(`/users/${userId}/products/${encodeURIComponent(productName)}`)
      .then((r) => r.data),

  removeBoughtItems: (userId: string, names: string[]) =>
    api
      .delete<GroceryItemGroup[]>(`/users/${userId}/products/bought`, { data: { names } })
      .then((r) => r.data),

  clearList: (userId: string) =>
    api.delete(`/users/${userId}/products`),

  importRecipe: (userId: string, recipeId: string, mealPlanId?: string) =>
    api
      .post<GroceryItemGroup[]>(`/users/${userId}/recipes/${recipeId}/ingredients`, { mealPlanId })
      .then((r) => r.data),

  searchProducts: (userId: string, name: string) =>
    api
      .get<GroceryItem[]>(`/users/${userId}/products/search`, { params: { name } })
      .then((r) => r.data),

  toggleItem: (userId: string, productName: string) =>
    api
      .patch<GroceryItemGroup[]>(`/users/${userId}/products/${encodeURIComponent(productName)}/toggle`)
      .then((r) => r.data),

  updateInventoryQuantity: (userId: string, productName: string, inventoryQuantity: number) =>
    api
      .patch<GroceryItemGroup[]>(`/users/${userId}/products/${encodeURIComponent(productName)}/inventory`, { inventoryQuantity })
      .then((r) => r.data),
};
