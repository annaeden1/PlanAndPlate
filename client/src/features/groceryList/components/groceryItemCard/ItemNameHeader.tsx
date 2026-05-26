import { Chip, Stack, Typography } from '@mui/material';

interface ItemNameHeaderProps {
  name: string;
  isDone: boolean;
  isInStock: boolean;
  recipeCount: number;
}

export const ItemNameHeader = ({ name, isDone, isInStock, recipeCount }: ItemNameHeaderProps) => (
  <Stack direction="row" alignItems="center" spacing="0.5rem" flexWrap="wrap">
    <Typography
      variant="body1"
      fontWeight={600}
      sx={{
        textTransform: 'capitalize',
        textDecoration: isDone ? 'line-through' : 'none',
        color: isDone ? 'text.secondary' : 'text.primary',
      }}
    >
      {name}
    </Typography>

    <Chip
      label={
        recipeCount !== 0
          ? `Appears in ${recipeCount} recipe${recipeCount === 1 ? '' : 's'}`
          : 'Manually Added'
      }
      size="small"
      color="primary"
      variant="outlined"
      sx={{ height: '1.5rem', fontSize: '0.7rem' }}
    />

    {isDone && (
      <Chip
        label={isInStock ? 'In Stock' : 'Done'}
        size="small"
        icon={<span style={{ fontSize: '0.75rem', marginLeft: '0.375rem' }}>✓</span>}
        sx={{
          backgroundColor: 'rgba(62, 180, 137, 0.12)',
          color: 'success.main',
          fontWeight: 600,
          fontSize: '0.7rem',
          height: '1.25rem',
          '& .MuiChip-icon': { color: 'success.main' },
        }}
      />
    )}
  </Stack>
);
