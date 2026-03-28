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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { ProgressCard } from '../components/common/ProgressCard';
import { GroceryItemCard } from '../components/grocery/GroceryItemCard';
import { useGroceryList } from '../context/GroceryListContext';
import type { IGroceryItem } from '../types/grocery';
import { UNIT_OPTIONS } from '../utils/grocery/unitOptions';

const EMPTY_FORM = { name: '', quantity: '', unit: '' };


export const GroceryList = () => {
  const { groups, loading, error, toggleChecked, removeItem, removeBoughtItems, addItem } = useGroceryList();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allItems = useMemo<IGroceryItem[]>(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

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

  const handleOpenDialog = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    const qty = Number(form.quantity);
    if (!form.quantity || !Number.isFinite(qty) || qty <= 0) {
      setFormError('Quantity must be a positive number'); return;
    }
    if (!form.unit.trim()) { setFormError('Unit is required'); return; }

    setFormError('');
    setSubmitting(true);
    try {
      await addItem({ name: form.name.trim(), quantity: Number(form.quantity), unit: form.unit.trim() });
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

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

      {error && (
        <Alert severity="error" sx={{ mb: '1.5rem' }}>
          {error}
        </Alert>
      )}

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
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
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
              bgcolor: 'transparent',
            },
          }}
        >
          Add Item
        </Button>
        {checkedItems > 0 && (
          <Button
            fullWidth
            variant="contained"
            color="success"
            sx={{ borderRadius: '1rem', py: '0.75rem' }}
            onClick={removeBoughtItems}
          >
            Bought it! Remove {checkedItems} item{checkedItems > 1 ? 's' : ''}
          </Button>
        )}
      </Box>

      {/* List Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '3rem' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Stack spacing="0.75rem">
          {filteredItems.map((item) => (
            <GroceryItemCard
              key={item.name}
              item={item}
              onToggleCheck={toggleChecked}
              onDelete={removeItem}
            />
          ))}
          {filteredItems.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ py: '2rem' }}
            >
              No items found.
            </Typography>
          )}
        </Stack>
      )}

      {/* Add Item Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: '1rem' } } }}
      >
        <DialogTitle fontWeight="bold">Add Item</DialogTitle>
        <DialogContent>
          <Stack spacing="1rem" sx={{ mt: '0.5rem' }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Product name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              size="small"
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: '0.75rem' }}>
              <TextField
                label="Quantity"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                size="small"
                sx={{ flex: 1 }}
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
              />
              <Autocomplete
                options={UNIT_OPTIONS}
                groupBy={(o) => o.group}
                getOptionLabel={(o) => (typeof o === 'string' ? o : o.unit)}
                value={UNIT_OPTIONS.find((o) => o.unit === form.unit) ?? null}
                onChange={(_, val) => setForm((f) => ({ ...f, unit: typeof val === 'string' ? val : (val?.unit ?? '') }))}
                freeSolo
                onInputChange={(_, val) => setForm((f) => ({ ...f, unit: val }))}
                sx={{ flex: 1 }}
                renderInput={(params) => (
                  <TextField {...params} label="Unit" size="small" placeholder="e.g. kg" />
                )}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: '1.5rem', pb: '1.25rem' }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
