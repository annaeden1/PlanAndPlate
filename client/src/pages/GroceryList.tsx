import { useGroceryList } from '@/context/GroceryListContext';
import { AddItemDialog } from '@/features/groceryList/components/AddItemDialog';
import { GroceryItemCard } from '@/features/groceryList/components/GroceryItemCard';
import type { Category, GroceryItem, GroceryItemGroup } from '@/features/groceryList/types/grocery';
import { CATEGORY_EMOJIS } from '@/features/groceryList/utils/categoryEmojis';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { ProgressCard } from '../components/common/ProgressCard';
import { PageHeader } from '@/components/common/PageHeader';

export const GroceryList = () => {
  const { groups, loading, error, toggleChecked, removeItem, removeBoughtItems, addItem } = useGroceryList();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map((g: GroceryItemGroup) => ({ ...g, items: g.items.filter((item: GroceryItem) => item.name.toLowerCase().includes(q)) }))
      .filter((g: GroceryItemGroup) => g.items.length > 0);
  }, [groups, searchQuery]);

  const { totalItems, checkedItems, itemsToBuy, percentage } = useMemo(() => {
    const allItems = groups.flatMap((g) => g.items);
    const total = allItems.length;
    const checked = allItems.filter((item) => item.checked).length;
    return {
      totalItems: total,
      checkedItems: checked,
      itemsToBuy: total - checked,
      percentage: total === 0 ? 0 : (checked / total) * 100,
    };
  }, [groups]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: '3rem' }}>
      <PageHeader 
        title="Grocery List" 
        subtitle="Smart shopping made easy"
      />
      <Box sx={{ maxWidth: 600, mx: 'auto', p: '1.5rem', mt: '-2rem' }}>

      {error && <Alert severity="error" sx={{ mb: '1.5rem' }}>{error}</Alert>}

      <ProgressCard
        title="Shopping Progress"
        primaryText={`${checkedItems} of ${totalItems} items`}
        chipLabel={`${itemsToBuy} to buy`}
        progressValue={percentage}
      />

      <Box sx={{ mb: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            borderStyle: 'dashed', borderWidth: 2, borderRadius: '1rem', py: '0.75rem',
            color: 'text.primary', borderColor: 'divider',
            '&:hover': { borderStyle: 'dashed', borderWidth: 2, borderColor: 'primary.main', bgcolor: 'transparent' },
          }}
        >
          Add Item
        </Button>
        {checkedItems > 0 && (
          <Button
            fullWidth variant="contained" color="success"
            sx={{ borderRadius: '1rem', py: '0.75rem' }}
            onClick={removeBoughtItems}
          >
            Bought it! Remove {checkedItems} item{checkedItems > 1 ? 's' : ''}
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '3rem' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : filteredGroups.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: '2rem' }}>
          No items found.
        </Typography>
      ) : (
        <Stack spacing="1.5rem">
          {filteredGroups.map((group) => (
            <Box key={group.category}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {CATEGORY_EMOJIS[group.category as Category] || '🛒'} {group.category}
              </Typography>
              <Stack spacing="0.75rem">
                {group.items.map((item: GroceryItem) => (
                  <GroceryItemCard key={item.name} item={item} onToggleCheck={toggleChecked} onDelete={removeItem} />
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
      </Box>
    </Box>
  );
};
