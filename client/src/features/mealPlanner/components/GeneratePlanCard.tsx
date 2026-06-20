import { Box, Typography, CircularProgress } from '@mui/material';
import { gradients, shadows } from '@/core/theme/tokens';

interface GeneratePlanCardProps {
  onGenerate: () => void;
  loading?: boolean;
}

export const GeneratePlanCard = ({ onGenerate, loading }: GeneratePlanCardProps) => (
  <Box
    sx={{
      background: gradients.greenPanel,
      borderRadius: '1.5rem',
      p: '1.5rem',
      color: '#fff',
      boxShadow: shadows.greenPanel,
      animation: 'pp-slideUp .5s .12s both',
    }}
  >
    <Box sx={{ fontSize: 30 }}>✨</Box>
    <Typography
      sx={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 18,
        fontWeight: 700,
        mt: '0.625rem',
        lineHeight: 1.25,
      }}
    >
      Generate a fresh weekly plan
    </Typography>
    <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,.7)', mt: '0.375rem' }}>
      Balanced for your goals &amp; pantry.
    </Typography>
    <Box
      onClick={loading ? undefined : onGenerate}
      sx={{
        mt: '1rem',
        bgcolor: '#fff',
        color: 'primary.main',
        fontSize: 14,
        fontWeight: 700,
        textAlign: 'center',
        py: '0.8125rem',
        borderRadius: '0.875rem',
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.8 : 1,
        transition: 'transform .15s',
        '&:hover': loading ? {} : { transform: 'translateY(-0.125rem)' },
      }}
    >
      {loading ? <CircularProgress size={18} color="inherit" /> : 'Generate plan →'}
    </Box>
  </Box>
);
