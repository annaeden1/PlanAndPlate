import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { colors, shadows } from '@/core/theme/tokens';

interface ManualBarcodeEntryProps {
  barcode: string;
  scanning: boolean;
  error: string | null;
  onBarcodeChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const ManualBarcodeEntry = ({
  barcode,
  scanning,
  error,
  onBarcodeChange,
  onSubmit,
  onBack,
}: ManualBarcodeEntryProps) => {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: '1.625rem',
        p: '1.5rem',
        boxShadow: shadows.card,
        border: `1px solid ${colors.cardBorder}`,
        animation: 'pp-slideUp .5s both',
      }}
    >
      <Box
        onClick={onBack}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: 13.5,
          fontWeight: 600,
          color: colors.greenLeaf,
          cursor: 'pointer',
          mb: '0.875rem',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 18 }} /> Back to scanner
      </Box>

      <Typography variant="h3" sx={{ color: colors.ink, mb: '0.375rem' }}>
        Enter barcode manually
      </Typography>
      <Typography sx={{ fontSize: 13, color: colors.textMuted, mb: '1.125rem' }}>
        Type the digits printed under the product's barcode.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: '14px', borderRadius: '14px' }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Barcode"
        value={barcode}
        onChange={(e) => onBarcodeChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
      />

      <Button fullWidth variant="contained" size="large" onClick={onSubmit} disabled={scanning} sx={{ mt: '16px' }}>
        {scanning ? 'Searching…' : 'Find product'}
      </Button>
    </Box>
  );
};
