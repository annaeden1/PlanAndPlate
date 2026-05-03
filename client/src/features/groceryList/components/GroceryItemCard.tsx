import type { GroceryItem } from '@/features/groceryList/types/grocery';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Checkbox, Chip, IconButton, Paper, Stack, Typography } from '@mui/material';

interface GroceryItemCardProps {
  item: GroceryItem;
  onDelete: (name: string) => void;
  onUpdateInventory?: (name: string, quantity: number) => void;
  onToggle: (name: string) => void;
}

export const GroceryItemCard = ({ item, onDelete, onToggle }: GroceryItemCardProps) => {
  const isInStock = item.inventoryQuantity >= item.quantity;

  const formatQty = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(1);

  const buyLabel = (() => {
    if (isInStock) return null;
    if (item.marketUnit && item.marketQuantity != null && item.marketSize) {
      return `Buy ${item.marketQuantity} ${item.marketUnit} (${item.marketSize})`;
    }
    const deficit = Math.max(0, item.quantity - item.inventoryQuantity);
    return `Buy ${formatQty(deficit)} ${item.unit}`;
  })();

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
      <Checkbox
        checked={item.checked}
        onChange={() => onToggle(item.name)}
        sx={{
          color: 'divider',
          '&.Mui-checked': { color: 'primary.main' },
        }}
      />

      <Stack flexGrow={1} spacing="0.5rem">
        <Stack direction="row" alignItems="center" spacing="0.5rem" flexWrap="wrap">
          <Typography
            variant="body1"
            fontWeight={600}
            sx={{
              textTransform: 'capitalize',
              textDecoration: item.checked ? 'line-through' : 'none',
              color: item.checked ? 'text.secondary' : 'text.primary',
            }}
          >
            {item.name}
          </Typography>
          {isInStock && (
            <Chip
              label="In Stock"
              size="small"
              icon={<CheckIcon style={{ fontSize: '0.75rem' }} />}
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

        <Stack direction="row" alignItems="flex-end" spacing="1.5rem">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Need
            </Typography>
            <Typography sx={{ pt: '0.1rem' }} variant="body2" fontWeight={600}>
              {formatQty(item.quantity)} {item.unit}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Have
            </Typography>
            <Typography sx={{ pt: '0.1rem' }} variant="body2" fontWeight={600}>
              {formatQty(item.inventoryQuantity)} {item.unit}
            </Typography>
          </Box>

          {buyLabel && (
            <Chip
              label={buyLabel}
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
        </Stack>
      </Stack>

      <IconButton
        size="small"
        aria-label={`Remove ${item.name}`}
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
