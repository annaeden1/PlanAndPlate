import type { GroceryItem } from '@/features/groceryList/types/grocery';
import CloseIcon from '@mui/icons-material/Close';
import { Checkbox, Box, IconButton, Stack } from '@mui/material';
import { colors } from '@/core/theme/tokens';
import { BuyOrDoneAction } from './groceryItemCard/BuyOrDoneAction';
import { HaveStepper } from './groceryItemCard/HaveStepper';
import { ItemNameHeader } from './groceryItemCard/ItemNameHeader';
import { NeedDisplay } from './groceryItemCard/NeedDisplay';

interface GroceryItemCardProps {
  item: GroceryItem;
  onDelete: (name: string) => void;
  onUpdateInventory: (name: string, quantity: number) => void;
  onDone: (name: string) => void;
  onToggle: (name: string) => void;
}

export const GroceryItemCard = ({
  item,
  onDelete,
  onUpdateInventory,
  onDone,
  onToggle,
}: GroceryItemCardProps) => {
  const isInStock = item.inventoryQuantity >= item.quantity;
  const isDone = isInStock || item.checked;
  const buyAmount = Math.max(0, item.quantity - item.inventoryQuantity);

  return (
    <Box
      sx={{
        p: '0.6875rem 0.8125rem',
        borderRadius: '0.875rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        backgroundColor: isDone ? '#f1f8f4' : '#faf9f4',
        border: `1px solid ${isDone ? 'rgba(47,191,135,.25)' : colors.cardBorder}`,
        transition: 'background .25s, transform .12s, border-color .2s',
        '&:hover': { transform: 'translateX(0.1875rem)' },
      }}
    >
      <Checkbox
        checked={isDone}
        onChange={() => onToggle(item.name)}
        disableRipple
        sx={{
          p: '0.125rem',
          color: '#cfd6cf',
          '&.Mui-checked': { color: colors.greenBright },
        }}
      />

      <Stack flexGrow={1} spacing="0.5rem" sx={{ minWidth: 0 }}>
        <ItemNameHeader
          name={item.name}
          isDone={isDone}
          isInStock={isInStock}
          recipeCount={item.recipeCount}
        />

        <Stack direction="row" alignItems="flex-end" spacing="1.25rem" flexWrap="wrap" useFlexGap>
          <NeedDisplay quantity={item.quantity} unit={item.unit} />
          <HaveStepper
            inventoryQuantity={item.inventoryQuantity}
            unit={item.unit}
            onUpdate={(next) => onUpdateInventory(item.name, next)}
          />
          <BuyOrDoneAction
            isDone={isDone}
            buyAmount={buyAmount}
            unit={item.unit}
            onDone={() => onDone(item.name)}
          />
        </Stack>
      </Stack>

      <IconButton
        size="small"
        onClick={() => onDelete(item.name)}
        sx={{
          alignSelf: 'flex-start',
          color: colors.textGhost,
          '&:hover': { color: colors.danger },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
