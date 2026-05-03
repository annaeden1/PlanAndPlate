import { useGroceryList } from '@/context/GroceryListContext';
import { AddItemDialog } from '@/features/groceryList/components/AddItemDialog';
import { GroceryItemCard } from '@/features/groceryList/components/GroceryItemCard';
import type { Category, GroceryItem, GroceryItemGroup } from '@/features/groceryList/types/grocery';
import { CATEGORY_EMOJIS } from '@/features/groceryList/utils/categoryEmojis';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fab,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useMemo, useState } from 'react';
import { ProgressCard } from '../components/common/ProgressCard';

export const GroceryList = () => {
  const { groups, loading, error, removeItem, addItem, toggleChecked, finishShopping } = useGroceryList();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return groups
      .map((g: GroceryItemGroup) => ({
        ...g,
        items: g.items.filter((item: GroceryItem) => {
          const needsToBuy = item.inventoryQuantity < item.quantity;
          const matchesSearch = !q || item.name.toLowerCase().includes(q);
          return needsToBuy && matchesSearch;
        }),
      }))
      .filter((g: GroceryItemGroup) => g.items.length > 0);
  }, [groups, searchQuery]);

  const { totalItems, inStockItems, itemsToBuy, percentage } = useMemo(() => {
    const allItems = groups.flatMap((g) => g.items);
    const total = allItems.length;
    const inStock = allItems.filter((item) => item.inventoryQuantity >= item.quantity).length;
    return {
      totalItems: total,
      inStockItems: inStock,
      itemsToBuy: total - inStock,
      percentage: total === 0 ? 0 : (inStock / total) * 100,
    };
  }, [groups]);

  const hasCheckedItems = useMemo(() => {
    return groups.some((g) => g.items.some((item) => item.checked));
  }, [groups]);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, pb: hasCheckedItems ? 12 : 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Grocery List</Typography>
        <Typography variant="subtitle1" color="text.secondary">Smart shopping made easy</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <ProgressCard
        title="Shopping Progress"
        primaryText={`${inStockItems} of ${totalItems} items in stock`}
        chipLabel={`${itemsToBuy} to buy`}
        progressValue={percentage}
      />

      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '1rem', backgroundColor: 'background.paper' } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
              ),
            },
          }}
        />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{
            borderStyle: 'dashed', borderWidth: 2, borderRadius: '1rem', py: 1.5,
            color: 'text.primary', borderColor: 'divider',
            '&:hover': { borderStyle: 'dashed', borderWidth: 2, borderColor: 'primary.main', bgcolor: 'transparent' },
          }}
        >
          Add Item
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : filteredGroups.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          No items found.
        </Typography>
      ) : (
        <Stack spacing={3}>
          {filteredGroups.map((group) => (
            <Box key={group.category}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {CATEGORY_EMOJIS[group.category as Category] || '🛒'} {group.category}
              </Typography>
              <Stack spacing={1.5}>
                {group.items.map((item: GroceryItem) => (
                  <GroceryItemCard key={item.name} item={item} onDelete={removeItem} onToggle={toggleChecked} />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <AddItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={addItem}
      />

      {hasCheckedItems && (
        <Fab
          variant="extended"
          color="primary"
          onClick={finishShopping}
          sx={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: 4,
            fontWeight: 'bold',
            px: 4,
          }}
        >
          <CheckIcon sx={{ mr: 1 }} />
          Finish Shopping
        </Fab>
      )}
    </Box>
  );
};
