import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroceryList } from '@/context/GroceryListContext';
import { useMealPlanner } from '@/context/MealPlannerContext';

const MAX_RESULTS = 4;

export function useGlobalSearch() {
  const navigate = useNavigate();
  const { groups } = useGroceryList();
  const { meals } = useMealPlanner();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const trimmed = query.trim().toLowerCase();

  const matchedMeals = useMemo(() => {
    if (trimmed.length < 2) return [];
    return meals.filter((m) => m.name.toLowerCase().includes(trimmed)).slice(0, MAX_RESULTS);
  }, [meals, trimmed]);

  const matchedItems = useMemo(() => {
    if (trimmed.length < 2) return [];
    return groups
      .flatMap((g) => g.items)
      .filter((item) => item.name.toLowerCase().includes(trimmed))
      .slice(0, MAX_RESULTS);
  }, [groups, trimmed]);

  const hasResults = matchedMeals.length > 0 || matchedItems.length > 0;
  const showDropdown = open && trimmed.length >= 2;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  }, []);

  const goTo = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery('');
      navigate(path);
    },
    [navigate],
  );

  return {
    query,
    open,
    setOpen,
    showDropdown,
    hasResults,
    matchedMeals,
    matchedItems,
    handleChange,
    handleKeyDown,
    goTo,
  };
}
