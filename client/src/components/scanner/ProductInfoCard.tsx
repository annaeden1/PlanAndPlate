import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { formatTags } from '../../utils/scanner/nutrition';
import type { ProductData } from '../../shared';

export interface ProductInfoCardProps {
  data: ProductData;
}

export const ProductInfoCard = ({ data }: ProductInfoCardProps) => {
  const nutritionData = data?.nutritionData;

  const tags = formatTags(nutritionData?.ingredients_analysis_tags || []);

  return (
    <Card sx={{ overflow: 'hidden', mb: '1rem' }}>
      {nutritionData?.image_front_url && (
        <Box sx={{ position: 'relative', height: '16rem' }}>
          <Box
            component="img"
            src={nutritionData.image_front_url}
            alt={nutritionData?.product_name || 'product image'}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
      )}

      <CardContent>
        <Typography variant="h2" sx={{ mb: '0.5rem' }}>
          {nutritionData?.product_name || 'Unknown product'}
        </Typography>

        <Typography color="text.secondary" sx={{ mb: '1rem' }}>
          {nutritionData?.brands || ''}
          {nutritionData?.quantity ? ` • ${nutritionData.quantity}` : ''}
        </Typography>

        {tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tags.map((tag, index) => (
              <Chip
                key={tag}
                icon={
                  index === 0 ? (
                    <AutoAwesomeIcon sx={{ fontSize: '0.875rem' }} />
                  ) : undefined
                }
                label={tag}
                size="small"
                sx={
                  index === 0
                    ? {
                        bgcolor: 'rgba(62, 180, 137, 0.1)',
                        color: 'primary.main',
                      }
                    : undefined
                }
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
