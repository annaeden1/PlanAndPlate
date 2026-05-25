import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { formatQty } from './utils';

interface HaveStepperProps {
  inventoryQuantity: number;
  unit: string;
  onUpdate: (next: number) => void;
}

export const HaveStepper = ({ inventoryQuantity, unit, onUpdate }: HaveStepperProps) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={500}>
      Have
    </Typography>
    <Stack direction="row" alignItems="center" spacing="0.25rem" sx={{ pt: '0.1rem' }}>
      <IconButton
        size="small"
        onClick={() => onUpdate(inventoryQuantity - 1)}
        disabled={inventoryQuantity === 0}
        sx={{ p: '0.125rem' }}
      >
        <RemoveIcon sx={{ fontSize: '0.9rem' }} />
      </IconButton>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ minWidth: '2.5rem', textAlign: 'center' }}
      >
        {formatQty(inventoryQuantity)} {unit}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onUpdate(inventoryQuantity + 1)}
        sx={{ p: '0.125rem' }}
      >
        <AddIcon sx={{ fontSize: '0.9rem' }} />
      </IconButton>
    </Stack>
  </Box>
);
