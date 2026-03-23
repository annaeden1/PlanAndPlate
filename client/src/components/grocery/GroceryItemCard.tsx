import { Paper, Box, Checkbox, Stack, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { IGroceryItem } from '../../types/grocery';

interface GroceryItemCardProps {
  item: IGroceryItem;
  onToggleCheck: (id: string) => void;
  onDelete: (id: string) => void;
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
        backgroundColor: item.isChecked ? 'action.hover' : 'background.paper',
        borderColor: item.isChecked ? 'success.main' : 'divider',
        opacity: item.isChecked ? 0.7 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mr: '1rem' }}>
        <Checkbox
          checked={item.isChecked}
          onChange={() => onToggleCheck(item.id)}
          color="success"
          sx={{ p: 0 }}
        />
      </Box>
      
      <Stack direction="column" flexGrow={1} spacing="0.25rem">
        <Typography 
          variant="body1" 
          fontWeight={500}
          sx={{ 
            textDecoration: item.isChecked ? 'line-through' : 'none',
            color: item.isChecked ? 'text.secondary' : 'text.primary'
          }}
        >
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Need: {item.neededAmount} {item.unit}
        </Typography>
      </Stack>

      <Box sx={{ display: 'flex', alignItems: 'center', ml: '1rem' }}>
        <IconButton 
          size="small" 
          onClick={() => onDelete(item.id)}
          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};
