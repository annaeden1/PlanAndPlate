import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Alert,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ProductAlternative } from '@/shared';

interface AiSuggestionsDialogProps {
  open: boolean;
  onClose: () => void;
  alternatives: ProductAlternative[];
  countLabel: string;
}

const cardBorder = '#F3C898';
const textAccent = '#A85A16';

export const AiSuggestionsDialog = ({
  open,
  onClose,
  alternatives,
  countLabel,
}: AiSuggestionsDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
      >
        <AutoAwesomeRoundedIcon sx={{ color: textAccent }} />
        <Box>
          <Typography variant="h4" sx={{ color: textAccent }}>
            AI Suggestions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {countLabel}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: '0.5rem' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Alert
            severity="warning"
            icon={<WarningAmberIcon />}
            sx={{
              bgcolor: 'rgba(168, 90, 22, 0.12)',
              border: `1px solid ${textAccent}`,
              '& .MuiAlert-message': {
                fontSize: '0.9rem',
                fontWeight: 500,
              },
            }}
          >
            We cannot guarantee that AI-suggested products are completely free
            of allergens or match all your dietary requirements. Always verify
            ingredients before consumption.
          </Alert>

          {alternatives.map((alternative) => (
            <Card
              key={`${alternative.brand}-${alternative.productName}`}
              sx={{
                p: '1rem',
                bgcolor: '#FFF9F2',
                border: `1px solid ${cardBorder}`,
                boxShadow: 'none',
              }}
            >
              {alternative.verified &&
              alternative.productData?.image_front_url ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '10.5rem',
                    borderRadius: '0.9rem',
                    overflow: 'hidden',
                    mb: '0.9rem',
                    bgcolor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    component="img"
                    src={alternative.productData.image_front_url}
                    alt={alternative.productName}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              ) : null}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  mb: '0.5rem',
                }}
              >
                <Box>
                  <Typography variant="h5" sx={{ mb: '0.25rem' }}>
                    {alternative.productName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {alternative.brand}
                    {alternative.productData?.quantity
                      ? ` • ${alternative.productData.quantity}`
                      : ''}
                  </Typography>
                </Box>

                <Chip
                  label={alternative.verified ? 'Verified' : 'AI suggestion'}
                  size="small"
                  sx={{
                    bgcolor: alternative.verified
                      ? 'rgba(62, 180, 137, 0.14)'
                      : '#FFFFFF',
                    color: alternative.verified ? 'primary.main' : textAccent,
                    fontWeight: 700,
                  }}
                />
              </Box>

              <Typography variant="body2">{alternative.reason}</Typography>
            </Card>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: '1.5rem', pb: '1.25rem' }}>
        <Button
          onClick={onClose}
          sx={{
            bgcolor: '#FFFFFF',
            color: textAccent,
            fontWeight: 700,
            border: `1px solid ${cardBorder}`,
            '&:hover': {
              bgcolor: '#FFF9F2',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
