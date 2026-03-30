import { Paper, Box, Checkbox, Stack, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { IGroceryItem } from '../../types/grocery';

interface GroceryItemCardProps {
  item: IGroceryItem;
  onToggleCheck: (name: string) => void;
  onDelete: (name: string) => void;
}

export const GroceryItemCard = ({ item, onToggleCheck, onDelete }: GroceryItemCardProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: '1rem',
        borderRadius: '1rem',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s',
        backgroundColor: item.checked ? 'action.hover' : 'background.paper',
        borderColor: item.checked ? 'success.main' : 'divider',
        opacity: item.checked ? 0.7 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mr: '1rem' }}>
        <Checkbox
          checked={item.checked}
          onChange={() => onToggleCheck(item.name)}
          color="success"
          sx={{ p: 0 }}
        />
      </Box>

      <Stack direction="column" flexGrow={1} spacing="0.25rem">
        <Typography
          variant="body1"
          fontWeight={500}
          sx={{
            textDecoration: item.checked ? 'line-through' : 'none',
            color: item.checked ? 'text.secondary' : 'text.primary',
          }}
        >
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Need: {item.quantity} {item.unit}
        </Typography>
      </Stack>

      <Box sx={{ display: 'flex', alignItems: 'center', ml: '1rem' }}>
        <IconButton
          size="small"
          onClick={() => onDelete(item.name)}
          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};
