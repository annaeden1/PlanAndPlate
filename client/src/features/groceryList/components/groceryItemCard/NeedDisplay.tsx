import { Box, Typography } from '@mui/material';
import { formatQty } from './utils';

interface NeedDisplayProps {
  quantity: number;
  unit: string;
}

export const NeedDisplay = ({ quantity, unit }: NeedDisplayProps) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={500}>
      Need
    </Typography>
    <Typography sx={{ pt: '0.1rem' }} variant="body2" fontWeight={600}>
      {formatQty(quantity)} {unit}
    </Typography>
  </Box>
);
