import { useGroceryList } from '@/context/GroceryListContext';
import { AddItemDialog } from '@/features/groceryList/components/AddItemDialog';
import { GroceryCategoryGroup } from '@/features/groceryList/components/GroceryCategoryGroup';
import { GroceryEmptyState } from '@/features/groceryList/components/GroceryEmptyState';
import { ShoppingProgressCard } from '@/features/groceryList/components/ShoppingProgressCard';
import type { GroceryItem, GroceryItemGroup } from '@/features/groceryList/types/grocery';
import { computeGroceryStats } from '@/features/groceryList/utils/groceryStats';
import AddIcon from '@mui/icons-material/Add';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { colors } from '@/core/theme/tokens';

export const GroceryList = () => {
  const {
    groups,
    loading,
    error,
    removeItem,
    addItem,
    updateInventoryQuantity,
    removeBoughtItems,
    toggleChecked,
  } = useGroceryList();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map((g: GroceryItemGroup) => ({
        ...g,
        items: g.items.filter((item: GroceryItem) => item.name.toLowerCase().includes(q)),
      }))
      .filter((g: GroceryItemGroup) => g.items.length > 0);
  }, [groups, searchQuery]);

  const stats = useMemo(() => computeGroceryStats(groups), [groups]);

  return (
    <Box sx={{ animation: 'pp-slideUp .4s both' }}>
      <ShoppingProgressCard
        inStockItems={stats.inStockItems}
        totalItems={stats.totalItems}
        itemsToBuy={stats.itemsToBuy}
        percentage={stats.percentage}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', mt: '1.25rem', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search items…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colors.textFaint }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ borderStyle: 'dashed', borderWidth: 2, '&:hover': { borderStyle: 'dashed', borderWidth: 2 } }}
        >
          Add item
        </Button>
        {stats.hasInStockItems && (
          <Button variant="contained" startIcon={<CheckRoundedIcon />} onClick={removeBoughtItems}>
            Finish shopping
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: '1.125rem', borderRadius: '0.875rem' }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '3rem' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : filteredGroups.length === 0 ? (
        <GroceryEmptyState searching={Boolean(searchQuery)} />
      ) : (
        <Box
          sx={{
            mt: '1.375rem',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: '1.125rem',
            alignItems: 'start',
          }}
        >
          {filteredGroups.map((group, gi) => (
            <GroceryCategoryGroup
              key={group.category}
              group={group}
              index={gi}
              onDelete={removeItem}
              onUpdateInventory={updateInventoryQuantity}
              onToggle={toggleChecked}
            />
          ))}
        </Box>
      )}

      <AddItemDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdd={addItem} />
    </Box>
  );
};
