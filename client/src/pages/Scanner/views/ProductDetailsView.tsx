import { Box, Button, Typography } from '@mui/material';
import type { ProductData } from '../../../shared';
import { mapNutritionFacts } from '../../../utils/scanner/nutrition';
import { HealthScoreCard } from '../../../components/scanner/HealthScoreCard';
import { NutritionFactsCard } from '../../../components/scanner/NutritionFactsCard';
import { PreferenceMatchesCard } from '../../../components/scanner/PreferenceMatchesCard';
import { ProductInfoCard } from '../../../components/scanner/ProductInfoCard';

interface ProductDetailsViewProps {
  product: ProductData;
  onScanAnother: () => void;
}

export const ProductDetailsView = ({
  product,
  onScanAnother,
}: ProductDetailsViewProps) => {
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
        }}
      >
        <Box sx={{ maxWidth: '28rem', mx: 'auto', width: '100%' }}>
          <ProductInfoCard data={product} />

          <HealthScoreCard
            grade={product.nutritionData?.nutriscore_grade || 'unknown'}
          />

          <NutritionFactsCard nutritionFacts={mapNutritionFacts(product)} />

          <PreferenceMatchesCard
            preferenceMatches={[
              {
                label: 'Matches your preferences',
                match: product.matchesPreferences || false,
              },
            ]}
          />

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
