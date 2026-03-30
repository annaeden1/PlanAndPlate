import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { groceryListApi } from '../api/groceryList';
import { getErrorMessage } from '../utils/errorMessage';
import type { IGroceryItem, IGroceryItemGroup } from '../types/grocery';
import { getUserId } from '../shared/utils/userId';

interface GroceryListState {
  groups: IGroceryItemGroup[];
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
  toggleChecked: (productName: string) => void;
}

const GroceryListContext = createContext<(GroceryListState & GroceryListActions) | null>(null);

export const GroceryListProvider = ({ children }: { children: ReactNode }) => {
  const userId = getUserId() ?? '';
  const [groups, setGroups] = useState<IGroceryItemGroup[]>([]);
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
      const checkedNames = groups
        .flatMap((g) => g.items)
        .filter((item) => item.checked)
        .map((item) => item.name);
      if (checkedNames.length === 0) return;
      const data = await groceryListApi.removeBoughtItems(userId, checkedNames);
      setGroups(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [groups, userId]);

  // TODO: persist checked state to backend once a PATCH endpoint is added
  const toggleChecked = useCallback((productName: string) => {
    setGroups((prev) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item: IGroceryItem) =>
          item.name === productName ? { ...item, checked: !item.checked } : item,
        ),
      })),
    );
  }, []);

  return (
    <GroceryListContext.Provider
      value={{ groups, loading, error, userId, refresh, addItem, removeItem, removeBoughtItems, clearList, toggleChecked }}
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
