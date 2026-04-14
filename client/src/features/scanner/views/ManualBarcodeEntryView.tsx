import {
  Alert,
  Box,
  Button,
  Card,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface ManualBarcodeEntryViewProps {
  barcode: string;
  scanning: boolean;
  error: string | null;
  onBarcodeChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const ManualBarcodeEntryView = ({
  barcode,
  scanning,
  error,
  onBarcodeChange,
  onSubmit,
  onBack,
}: ManualBarcodeEntryViewProps) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: '1.5rem', pt: '3rem', pb: '1.5rem' }}>
        <Box sx={{ maxWidth: '28rem', mx: 'auto' }}>
          <IconButton onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h1">Manual Entry</Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, px: '1.5rem' }}>
        <Box sx={{ maxWidth: '28rem', mx: 'auto' }}>
          <Card sx={{ p: '2rem' }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              label="Barcode"
              value={barcode}
              onChange={(e) => onBarcodeChange(e.target.value)}
              sx={{ mt: error ? '1rem' : 0 }}
            />

            <Button fullWidth onClick={onSubmit} sx={{ mt: '1rem' }}>
              {scanning ? 'Searching...' : 'Find Product'}
            </Button>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};
