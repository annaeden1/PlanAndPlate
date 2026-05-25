import type { GroceryItem } from '@/features/groceryList/types/grocery';
import CloseIcon from '@mui/icons-material/Close';
import { Checkbox, IconButton, Paper, Stack } from '@mui/material';
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
    <Paper
      variant="outlined"
      sx={{
        p: '1rem',
        borderRadius: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        transition: 'border-color 0.2s',
        borderColor: isDone ? 'success.main' : 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Checkbox
        checked={isDone}
        onChange={() => onToggle(item.name)}
        sx={{
          color: 'divider',
          '&.Mui-checked': { color: 'primary.main' },
        }}
      />

      <Stack flexGrow={1} spacing="0.5rem">
        <ItemNameHeader name={item.name} isDone={isDone} isInStock={isInStock} />

        <Stack direction="row" alignItems="flex-end" spacing="1.5rem">
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
          color: 'text.secondary',
          '&:hover': { color: 'error.main' },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};
