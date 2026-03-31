import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Alert,
  CircularProgress,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import { UNIT_OPTIONS } from '../../utils/grocery/unitOptions';
import { CATEGORY_EMOJIS } from '../../utils/grocery/categoryEmojis';
import type { Category } from '../../types/grocery';

const CATEGORY_OPTIONS = Object.keys(CATEGORY_EMOJIS) as Category[];

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: { name: string; quantity: number; unit: string; aisle?: string }) => Promise<void>;
}

const EMPTY_FORM = { name: '', quantity: '', unit: '', aisle: '' };

export const AddItemDialog = ({ open, onClose, onAdd }: AddItemDialogProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    onClose();
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
      await onAdd({ name: form.name.trim(), quantity: qty, unit: form.unit.trim(), aisle: form.aisle || undefined });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
              onChange={(_, val) =>
                setForm((f) => ({ ...f, unit: typeof val === 'string' ? val : (val?.unit ?? '') }))
              }
              freeSolo
              onInputChange={(_, val) => setForm((f) => ({ ...f, unit: val }))}
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField {...params} label="Unit" size="small" placeholder="e.g. kg" />
              )}
            />
          </Box>
          <TextField
            select
            label="Aisle (optional)"
            value={form.aisle}
            onChange={(e) => setForm((f) => ({ ...f, aisle: e.target.value }))}
            fullWidth
            size="small"
          >
            <MenuItem value="">— None —</MenuItem>
            {CATEGORY_OPTIONS.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {CATEGORY_EMOJIS[cat]} {cat}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: '1.5rem', pb: '1.25rem' }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={18} color="inherit" /> : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
