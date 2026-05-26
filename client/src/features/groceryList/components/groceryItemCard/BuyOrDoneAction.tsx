import { Button, Chip } from '@mui/material';
import { formatQty } from './utils';

interface BuyOrDoneActionProps {
  isDone: boolean;
  buyAmount: number;
  unit: string;
  onDone: () => void;
}

export const BuyOrDoneAction = ({ isDone, buyAmount, unit, onDone }: BuyOrDoneActionProps) => {
  if (isDone) {
    return (
      <Button
        size="small"
        variant="outlined"
        color="success"
        onClick={onDone}
        sx={{
          alignSelf: 'flex-end',
          mb: '0.125rem',
          fontSize: '0.7rem',
          height: '1.375rem',
          px: '0.5rem',
          minWidth: 'unset',
          textTransform: 'none',
        }}
      >
        Done
      </Button>
    );
  }

  if (buyAmount > 0) {
    return (
      <Chip
        label={`Buy ${formatQty(buyAmount)} ${unit}`}
        size="small"
        sx={{
          backgroundColor: 'rgba(255, 143, 90, 0.12)',
          color: 'warning.main',
          fontWeight: 600,
          fontSize: '0.7rem',
          height: '1.375rem',
          alignSelf: 'flex-end',
          mb: '0.125rem',
        }}
      />
    );
  }

  return null;
};
