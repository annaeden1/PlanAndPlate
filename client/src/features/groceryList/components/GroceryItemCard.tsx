import type { GroceryItem } from '@/features/groceryList/types/grocery';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Chip, IconButton, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface GroceryItemCardProps {
  item: GroceryItem;
  onDelete: (name: string) => void;
  onUpdateInventory: (name: string, quantity: number) => void;
}

export const GroceryItemCard = ({ item, onDelete, onUpdateInventory }: GroceryItemCardProps) => {
  const [localHave, setLocalHave] = useState(item.inventoryQuantity);
  const isPendingRef = useRef(false);

  useEffect(() => {
    if (!isPendingRef.current) {
      setLocalHave(item.inventoryQuantity);
    }
  }, [item.inventoryQuantity]);

  const isInStock = localHave >= item.quantity;
  const buyAmount = Math.max(0, item.quantity - localHave);
  const step = Number.isInteger(item.quantity) ? 1 : 0.5;

  const adjust = (delta: number) => {
    const next = Math.max(0, localHave + delta * step);
    isPendingRef.current = true;
    setLocalHave(next);
    onUpdateInventory(item.name, next);
    setTimeout(() => { isPendingRef.current = false; }, 500);
  };

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
      {/* Item info */}
      <Stack flexGrow={1} spacing="0.5rem">
        <Stack direction="row" alignItems="center" spacing="0.5rem" flexWrap="wrap">
          <Typography variant="body1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
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
          {/* Need column */}
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
            <Stack direction="row" alignItems="center" spacing="0.2rem">
              <IconButton
                onClick={() => adjust(-1)}
                disabled={localHave <= 0}
                sx={{
                  width: '1.375rem',
                  height: '1.375rem',
                  p: 0,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  borderRadius: '50%',
                  '&:not(:disabled):hover': { borderColor: 'primary.main', color: 'primary.main' },
                }}
              >
                <RemoveIcon sx={{ fontSize: '0.7rem' }} />
              </IconButton>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ minWidth: '2.5rem', textAlign: 'center' }}
              >
                {formatQty(localHave)} {item.unit}
              </Typography>
              <IconButton
                onClick={() => adjust(1)}
                sx={{
                  width: '1.375rem',
                  height: '1.375rem',
                  p: 0,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  borderRadius: '50%',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                }}
              >
                <AddIcon sx={{ fontSize: '0.7rem' }} />
              </IconButton>
            </Stack>
          </Box>

          {/* Buy badge */}
          {buyAmount > 0 && (
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
