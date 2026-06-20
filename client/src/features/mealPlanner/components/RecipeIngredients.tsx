import { Box, Typography } from '@mui/material';
import { SurfaceCard } from '@/components/common/SurfaceCard';
import type { Ingredient } from '@/features/mealPlanner/types/mealPlanner';
import { colors } from '@/core/theme/tokens';

interface RecipeIngredientsProps {
  ingredients?: Ingredient[];
}

export const RecipeIngredients = ({ ingredients }: RecipeIngredientsProps) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '10px', mb: '14px' }}>
      <Typography variant="h2" sx={{ color: colors.ink }}>
        Ingredients
      </Typography>
      {ingredients?.length ? (
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.textMuted }}>
          {ingredients.length} item{ingredients.length === 1 ? '' : 's'}
        </Typography>
      ) : null}
    </Box>
    <SurfaceCard>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: '24px' }}>
        {ingredients?.map((ingredient: Ingredient, idx: number) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              py: '11px',
              borderBottom: `1px solid ${colors.hairline}`,
            }}
          >
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: colors.greenLeaf, flexShrink: 0 }} />
            <Typography
              sx={{ flex: 1, fontSize: 14, fontWeight: 600, color: colors.ink, textTransform: 'capitalize' }}
            >
              {ingredient.name}
            </Typography>
            <Box
              component="span"
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.greenLeaf,
                bgcolor: colors.mintTint,
                px: '10px',
                py: '3px',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              {ingredient.amount} {ingredient.unit}
            </Box>
          </Box>
        ))}
      </Box>
    </SurfaceCard>
  </Box>
);
