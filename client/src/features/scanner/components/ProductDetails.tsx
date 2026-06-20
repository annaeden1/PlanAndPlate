import { Box, Button } from '@mui/material';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import type { ProductData } from '@/shared';
import { mapNutritionFacts } from '@/features/scanner/utils/nutrition';
import { HealthScoreCard } from '@/features/scanner/components/HealthScoreCard';
import { NutritionFactsCard } from '@/features/scanner/components/NutritionFactsCard';
import { PreferenceMatchesCard } from '@/features/scanner/components/PreferenceMatchesCard';
import { ProductInfoCard } from '@/features/scanner/components/ProductInfoCard';

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

export const ProductDetails = ({ product, onScanAnother }: ProductDetailsProps) => {
  return (
    <Box sx={{ animation: 'pp-slideUp .45s both' }}>
      <ProductInfoCard data={product} />
      <HealthScoreCard grade={normalizeNutriScore(product.nutritionData?.nutriscore_grade)} />
      <NutritionFactsCard nutritionFacts={mapNutritionFacts(product)} />
      <PreferenceMatchesCard preferenceMatches={product.preferenceMatches || []} />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', pt: '0.25rem' }}>
        <Button variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={onScanAnother}>
          Scan another
        </Button>
        <Button variant="contained" startIcon={<AddShoppingCartRoundedIcon />}>
          Add to list
        </Button>
      </Box>
    </Box>
  );
};
