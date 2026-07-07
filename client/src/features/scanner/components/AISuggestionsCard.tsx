import { useState } from 'react';
import { Box, Button, Card, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import type { ProductAlternative } from '@/shared';
import { AiSuggestionsDialog } from './AiSuggestionsDialog';

interface AiSuggestionsCardProps {
  alternatives: ProductAlternative[];
}

const cardBackground = '#FFF0DE';
const cardBorder = '#F3C898';
const textAccent = '#A85A16';

export const AiSuggestionsCard = ({ alternatives }: AiSuggestionsCardProps) => {
  const [open, setOpen] = useState(false);
  const sortedAlternatives = [...alternatives].sort(
    (a, b) => Number(b.verified) - Number(a.verified),
  );

  if (!sortedAlternatives.length) {
    return null;
  }

  const countLabel = `${sortedAlternatives.length} better alternative${sortedAlternatives.length === 1 ? '' : 's'} found`;

  return (
    <>
      <Card
        sx={{
          p: '1.5rem',
          mb: '1rem',
          bgcolor: cardBackground,
          border: `1px solid ${cardBorder}`,
          boxShadow: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            mb: '0.35rem',
          }}
        >
          <AutoAwesomeRoundedIcon sx={{ color: textAccent }} />
          <Typography
            variant="h4"
            sx={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: textAccent,
            }}
          >
            AI Suggestions
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mb: '1rem',
            color: 'rgba(91, 52, 18, 0.72)',
          }}
        >
          {countLabel}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeRoundedIcon />}
            onClick={() => setOpen(true)}
            sx={{
              bgcolor: '#FFFFFF',
              color: textAccent,
              fontWeight: 700,
              borderRadius: '999px',
              px: '1.5rem',
              boxShadow: '0 8px 18px rgba(200, 132, 60, 0.12)',
              '&:hover': {
                bgcolor: '#FFF9F2',
                boxShadow: '0 10px 22px rgba(200, 132, 60, 0.18)',
              },
            }}
          >
            View Alternatives
          </Button>
        </Box>
      </Card>

      <AiSuggestionsDialog
        open={open}
        onClose={() => setOpen(false)}
        alternatives={sortedAlternatives}
        countLabel={countLabel}
      />
    </>
  );
};
