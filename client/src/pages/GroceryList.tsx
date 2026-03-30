import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { ProgressCard } from '../components/common/ProgressCard';
import { GroceryItemCard } from '../components/grocery/GroceryItemCard';
import { AddItemDialog } from '../components/grocery/AddItemDialog';
import { useGroceryList } from '../context/GroceryListContext';
import type { IGroceryItem } from '../types/grocery';

export const GroceryList = () => {
  const { groups, loading, error, toggleChecked, removeItem, removeBoughtItems, addItem } = useGroceryList();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const allItems = useMemo<IGroceryItem[]>(() => groups.flatMap((g) => g.items), [groups]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems;
    return allItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allItems, searchQuery]);

  const { totalItems, checkedItems, itemsToBuy, percentage } = useMemo(() => {
    const total = allItems.length;
    const checked = allItems.filter((item) => item.checked).length;
    return {
      totalItems: total,
      checkedItems: checked,
      itemsToBuy: total - checked,
      percentage: total === 0 ? 0 : (checked / total) * 100,
    };
  }, [allItems]);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: '1.5rem' }}>
      <Box sx={{ mb: '2rem' }}>
        <Typography variant="h4" fontWeight="bold">Grocery List</Typography>
        <Typography variant="subtitle1" color="text.secondary">Smart shopping made easy</Typography>
      </Box>

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
      ) : (
        <Stack spacing="0.75rem">
          {filteredItems.map((item) => (
            <GroceryItemCard key={item.name} item={item} onToggleCheck={toggleChecked} onDelete={removeItem} />
          ))}
          {filteredItems.length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: '2rem' }}>
              No items found.
            </Typography>
          )}
        </Stack>
      )}

      <AddItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={addItem}
      />
    </Box>
  );
};
