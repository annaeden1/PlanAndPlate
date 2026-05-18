import type { GroceryItem } from '@/features/groceryList/types/grocery';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Button, Checkbox, Chip, IconButton, Paper, Stack, Typography } from '@mui/material';

interface GroceryItemCardProps {
  item: GroceryItem;
  onDelete: (name: string) => void;
  onUpdateInventory: (name: string, quantity: number) => void;
  onDone: (name: string) => void;
}

export const GroceryItemCard = ({ item, onDelete, onUpdateInventory, onDone }: GroceryItemCardProps) => {
  const isInStock = item.inventoryQuantity >= item.quantity;
  const buyAmount = Math.max(0, item.quantity - item.inventoryQuantity);

  const formatQty = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(1);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: '1rem',
        borderRadius: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        transition: 'border-color 0.2s',
        borderColor: isInStock ? 'success.main' : 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Checkbox — read-only, driven by isInStock */}
      <Checkbox
        checked={isInStock}
        onChange={() => {}}
        sx={{
          pointerEvents: 'none',
          color: 'divider',
          '&.Mui-checked': { color: 'primary.main' },
        }}
      />

      {/* Item info */}
      <Stack flexGrow={1} spacing="0.5rem">
        <Stack direction="row" alignItems="center" spacing="0.5rem" flexWrap="wrap">
          <Typography
            variant="body1"
            fontWeight={600}
            sx={{
              textTransform: 'capitalize',
              textDecoration: isInStock ? 'line-through' : 'none',
              color: isInStock ? 'text.secondary' : 'text.primary',
            }}
          >
            {item.name}
          </Typography>
          {isInStock && (
            <Chip
              label="In Stock"
              size="small"
              icon={<span style={{ fontSize: '0.75rem', marginLeft: '6px' }}>✓</span>}
              sx={{
                backgroundColor: 'rgba(62, 180, 137, 0.12)',
                color: 'success.main',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: '20px',
                '& .MuiChip-icon': { color: 'success.main' },
              }}
            />
          )}
        </Stack>

        {/* Need / Have row */}
        <Stack direction="row" alignItems="flex-end" spacing="1.5rem">
          {/* Need */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Need
            </Typography>
            <Typography sx={{ pt: '0.1rem' }} variant="body2" fontWeight={600}>
              {formatQty(item.quantity)} {item.unit}
            </Typography>
          </Box>

          {/* Have stepper */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Have
            </Typography>
            <Stack direction="row" alignItems="center" spacing="0.25rem" sx={{ pt: '0.1rem' }}>
              <IconButton
                size="small"
                onClick={() => onUpdateInventory(item.name, item.inventoryQuantity - 1)}
                disabled={item.inventoryQuantity === 0}
                sx={{ p: '2px' }}
              >
                <RemoveIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
              <Typography variant="body2" fontWeight={600} sx={{ minWidth: '2.5rem', textAlign: 'center' }}>
                {formatQty(item.inventoryQuantity)} {item.unit}
              </Typography>
              <IconButton
                size="small"
                onClick={() => onUpdateInventory(item.name, item.inventoryQuantity + 1)}
                sx={{ p: '2px' }}
              >
                <AddIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Stack>
          </Box>

          {/* Buy badge (not in stock) OR Done button (in stock) */}
          {!isInStock && buyAmount > 0 && (
            <Chip
              label={`Buy ${formatQty(buyAmount)} ${item.unit}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 143, 90, 0.12)',
                color: 'warning.main',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: '22px',
                alignSelf: 'flex-end',
                mb: '2px',
              }}
            />
          )}
          {isInStock && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() => onDone(item.name)}
              sx={{
                alignSelf: 'flex-end',
                mb: '2px',
                fontSize: '0.7rem',
                height: '22px',
                px: '0.5rem',
                minWidth: 'unset',
                textTransform: 'none',
              }}
            >
              Done
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Delete */}
      <IconButton
        size="small"
        onClick={() => onDelete(item.name)}
        sx={{
          alignSelf: 'flex-start',
          color: 'text.secondary',
          '&:hover': { color: 'error.main' },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};
