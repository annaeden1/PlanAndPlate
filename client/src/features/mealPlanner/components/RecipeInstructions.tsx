import { Box, Typography } from '@mui/material';
import { SurfaceCard } from '@/components/common/SurfaceCard';
import { colors } from '@/core/theme/tokens';

interface RecipeInstructionsProps {
  steps?: string[];
}

export const RecipeInstructions = ({ steps }: RecipeInstructionsProps) => (
  <Box>
    <Typography variant="h2" sx={{ color: colors.ink, mb: '14px' }}>
      Instructions
    </Typography>
    <SurfaceCard>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {steps?.map((step: string, idx: number) => (
          <Box key={idx} sx={{ display: 'flex', gap: '14px' }}>
            <Box
              sx={{
                flexShrink: 0,
                width: 30,
                height: 30,
                borderRadius: '10px',
                bgcolor: colors.mintTint,
                color: colors.greenLeaf,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {idx + 1}
            </Box>
            <Typography sx={{ flex: 1, fontSize: 14.5, lineHeight: 1.6, color: colors.ink, pt: '3px' }}>
              {step}
            </Typography>
          </Box>
        ))}
      </Box>
    </SurfaceCard>
  </Box>
);
