import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { ProgressCard } from '../components/common/ProgressCard';
import { GroceryItemCard } from '../components/grocery/GroceryItemCard';
import type { IGroceryItem } from '../types/grocery';

const MOCK_ITEMS: IGroceryItem[] = [
  { id: '1', name: 'Avocados', neededAmount: 3, unit: 'pcs', isChecked: false },
  { id: '2', name: 'Cherry Tomatoes', neededAmount: 1, unit: 'pack', isChecked: false },
  { id: '3', name: 'Fresh Spinach', neededAmount: 1, unit: 'bunch', isChecked: true },
];

export const GroceryList = () => {
  const [items, setItems] = useState<IGroceryItem[]>(MOCK_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleCheck = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const { totalItems, checkedItems, itemsToBuy, percentage } = useMemo(() => {
    const total = items.length;
    const checked = items.filter((item) => item.isChecked).length;
    return {
      totalItems: total,
      checkedItems: checked,
      itemsToBuy: total - checked,
      percentage: total === 0 ? 0 : (checked / total) * 100
    };
  }, [items]);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: '1.5rem' }}>
      {/* Header Section */}
      <Box sx={{ mb: '2rem' }}>
        <Typography variant="h4" fontWeight="bold">
          Grocery List
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Smart shopping made easy
        </Typography>
      </Box>

      {/* Progress Card */}
      <ProgressCard
        title="Shopping Progress"
        primaryText={`${checkedItems} of ${totalItems} items`}
        chipLabel={`${itemsToBuy} to buy`}
        progressValue={percentage}
      />

      {/* Controls Section */}
      <Box sx={{ mb: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '1rem',
              backgroundColor: 'background.paper',
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }
          }}
        />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          sx={{
            borderStyle: 'dashed',
            borderWidth: 2,
            borderRadius: '1rem',
            py: '0.75rem',
            color: 'text.primary',
            borderColor: 'divider',
            '&:hover': {
              borderStyle: 'dashed',
              borderWidth: 2,
              borderColor: 'primary.main',
              bgcolor: 'transparent'
            }
          }}
        >
          Add Item
        </Button>
      </Box>

      {/* List Section */}
      <Stack spacing="0.75rem">
        {filteredItems.map((item) => (
          <GroceryItemCard
            key={item.id}
            item={item}
            onToggleCheck={handleToggleCheck}
            onDelete={handleDeleteItem}
          />
        ))}
        {filteredItems.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: '2rem' }}>
            No items found.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
