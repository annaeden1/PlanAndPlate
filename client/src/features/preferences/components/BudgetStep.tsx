import { Box, TextField, Typography } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface BudgetStepProps {
  budget: string;
  onChange: (budget: string) => void;
}

export function BudgetStep({ budget, onChange }: BudgetStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Box>
        <Typography variant="h2" sx={{ mb: '0.5rem' }}>
          Weekly Budget
        </Typography>
        <Typography color="text.secondary">
          How much do you want to spend on groceries per week?
        </Typography>
      </Box>

      <TextField
        fullWidth
        label="Weekly Budget ($)"
        type="number"
        placeholder="100"
        value={budget}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
          startAdornment: <AttachMoneyIcon color="action" sx={{ mr: 1 }} />,
        }}
        sx={{ mt: '1rem' }}
      />
    </Box>
  );
}
