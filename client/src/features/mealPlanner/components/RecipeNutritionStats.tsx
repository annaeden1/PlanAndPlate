import { Box, Typography } from '@mui/material';
import { SurfaceCard } from '@/components/common/SurfaceCard';
import type { ApiRecipe } from '@/features/mealPlanner/types/mealPlanner';
import { colors, fonts, gradients } from '@/core/theme/tokens';

interface RecipeNutritionStatsProps {
  recipe: ApiRecipe;
}

const MacroBar = ({
  label,
  grams,
  pct,
  gradient,
}: {
  label: string;
  grams: number;
  pct: number;
  gradient: string;
}) => (
  <Box sx={{ mb: '14px', '&:last-of-type': { mb: 0 } }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: '6px' }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.inkMuted }}>{label}</Typography>
      <Box sx={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>{grams}g</Typography>
        <Typography sx={{ fontSize: 11, color: colors.textMuted }}>{pct}% kcal</Typography>
      </Box>
    </Box>
    <Box sx={{ height: 7, borderRadius: '4px', bgcolor: colors.mintTint, overflow: 'hidden' }}>
      <Box
        sx={{
          height: '100%',
          borderRadius: '4px',
          background: gradient,
          width: `${pct}%`,
          transition: 'width .8s cubic-bezier(.34,1.1,.4,1)',
        }}
      />
    </Box>
  </Box>
);

export const RecipeNutritionStats = ({ recipe }: RecipeNutritionStatsProps) => {
  const calories = Math.round(recipe.calories || 0);
  const protein = Math.round(recipe.protein || 0);
  const fat = Math.round(recipe.fat || 0);
  const carbs = Math.round(recipe.carbs || 0);

  const kcal = Math.max(calories, 1);
  const share = (grams: number, kcalPerGram: number) =>
    Math.min(100, Math.round(((grams * kcalPerGram) / kcal) * 100));

  return (
    <Box>
      <Typography variant="h3" sx={{ color: colors.ink, mb: '14px' }}>
        Nutrition Facts
      </Typography>
      <SurfaceCard>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px', mb: '18px' }}>
          <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 36, color: colors.ink, lineHeight: 1 }}>
            {calories.toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.textMuted }}>kcal total</Typography>
        </Box>
        <MacroBar label="Protein" grams={protein} pct={share(protein, 4)} gradient={gradients.protein} />
        <MacroBar label="Carbs" grams={carbs} pct={share(carbs, 4)} gradient={gradients.carbs} />
        <MacroBar label="Fat" grams={fat} pct={share(fat, 9)} gradient={gradients.fat} />
      </SurfaceCard>
    </Box>
  );
};
