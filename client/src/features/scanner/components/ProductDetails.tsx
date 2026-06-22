import { Box, Button, Typography } from '@mui/material';
import type { ProductData } from '@/shared';
import { mapNutritionFacts } from '@/features/scanner/utils/nutrition';
import { HealthScoreCard } from '@/features/scanner/components/HealthScoreCard';
import { NutritionFactsCard } from '@/features/scanner/components/NutritionFactsCard';
import { PreferenceMatchesCard } from '@/features/scanner/components/PreferenceMatchesCard';
import { ProductInfoCard } from '@/features/scanner/components/ProductInfoCard';
import { AiSuggestionsCard } from './AISuggestionsCard';

const VALID_GRADES = ['a', 'b', 'c', 'd', 'e'] as const;
type NutriGrade = (typeof VALID_GRADES)[number] | 'unknown';

const normalizeNutriScore = (grade: string | undefined): NutriGrade => {
  if (!grade) return 'unknown';
  const normalized = grade.toLowerCase();
  if (VALID_GRADES.includes(normalized as (typeof VALID_GRADES)[number])) {
    return normalized as NutriGrade;
  }
  return 'unknown';
};

interface ProductDetailsProps {
  product: ProductData;
  onScanAnother: () => void;
}

export const ProductDetails = ({
  product,
  onScanAnother,
}: ProductDetailsProps) => {
  return (
    <Box>
      <Box sx={{ px: '1.5rem', pt: '3rem', pb: '1.5rem' }}>
        <Box sx={{ maxWidth: '28rem', mx: 'auto' }}>
          <Typography variant="h1" sx={{ fontSize: '1.875rem' }}>
            Product Details
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          px: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          pb: '6rem',
        }}
      >
        <Box sx={{ maxWidth: '28rem', mx: 'auto', width: '100%' }}>
          <ProductInfoCard data={product} />

          <HealthScoreCard
            grade={normalizeNutriScore(product.nutritionData?.nutriscore_grade)}
          />

          <NutritionFactsCard nutritionFacts={mapNutritionFacts(product)} />

          <PreferenceMatchesCard
            preferenceMatches={product.preferenceMatches || []}
          />

          <AiSuggestionsCard alternatives={product.alternatives || []} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              pt: '0.25rem',
            }}
          >
            <Button variant="outlined" onClick={onScanAnother}>
              Scan Another
            </Button>
            <Button variant="contained">Add to List</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
