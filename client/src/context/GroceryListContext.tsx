import { groceryListApi } from '@/features/groceryList/api/groceryList';
import type { GroceryItem, GroceryItemGroup } from '@/features/groceryList/types/grocery';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../shared/utils/errorMessage';
import { getUserId } from '../shared/utils/userId';

interface GroceryListState {
  groups: GroceryItemGroup[];
  loading: boolean;
  error: string | null;
  userId: string;
}

interface GroceryListActions {
  refresh: () => Promise<void>;
  addItem: (item: { name: string; quantity: number; unit: string; aisle?: string }) => Promise<void>;
  removeItem: (productName: string) => Promise<void>;
  removeBoughtItems: () => Promise<void>;
  clearList: () => Promise<void>;
  updateInventoryQuantity: (productName: string, quantity: number) => void;
  toggleChecked: (productName: string) => void;
}

const GroceryListContext = createContext<(GroceryListState & GroceryListActions) | null>(null);

export const GroceryListProvider = ({ children }: { children: ReactNode }) => {
  const userId = getUserId() ?? '';
  const [groups, setGroups] = useState<GroceryItemGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await groceryListApi.getAll(userId);
      setGroups(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (item: { name: string; quantity: number; unit: string; aisle?: string }) => {
      setError(null);
      try {
        const data = await groceryListApi.addProduct(userId, item);
        setGroups(data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [userId],
  );

  const removeItem = useCallback(
    async (productName: string) => {
      setError(null);
      try {
        const data = await groceryListApi.removeProduct(userId, productName);
        setGroups(data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [userId],
  );

  const clearList = useCallback(async () => {
    setError(null);
    try {
      await groceryListApi.clearList(userId);
      setGroups([]);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [userId]);

  const removeBoughtItems = useCallback(async () => {
    setError(null);
    try {
      const inStockNames = groups
        .flatMap((g) => g.items)
        .filter((item) => item.inventoryQuantity >= item.quantity || item.checked)
        .map((item) => item.name);
      if (inStockNames.length === 0) return;
      const data = await groceryListApi.removeBoughtItems(userId, inStockNames);
      setGroups(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [groups, userId]);

  const toggleChecked = useCallback((productName: string) => {
    setGroups((prev) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item: GroceryItem) =>
          item.name === productName ? { ...item, checked: !item.checked } : item,
        ),
      })),
    );
    groceryListApi.toggleItem(userId, productName)
      .then(setGroups)
      .catch(() => refresh());
  }, [userId, refresh]);

  const inventoryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (inventoryDebounceRef.current) clearTimeout(inventoryDebounceRef.current);
    };
  }, []);

  const updateInventoryQuantity = useCallback((productName: string, quantity: number) => {
    const clamped = Math.max(0, quantity);
    setGroups((prev) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item: GroceryItem) =>
          item.name === productName ? { ...item, inventoryQuantity: clamped } : item,
        ),
      })),
    );
    if (inventoryDebounceRef.current) clearTimeout(inventoryDebounceRef.current);
    inventoryDebounceRef.current = setTimeout(() => {
      groceryListApi.updateInventoryQuantity(userId, productName, clamped)
        .then(setGroups)
        .catch(() => refresh());
    }, 400);
  }, [userId, refresh]);

  return (
    <GroceryListContext.Provider
      value={{ groups, loading, error, userId, refresh, addItem, removeItem, removeBoughtItems, clearList, updateInventoryQuantity, toggleChecked }}
    >
      {children}
    </GroceryListContext.Provider>
  );
};

export const useGroceryList = () => {
  const ctx = useContext(GroceryListContext);
  if (!ctx) throw new Error('useGroceryList must be used inside GroceryListProvider');
  return ctx;
};
