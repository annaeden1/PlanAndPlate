import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import {
  Alert,
  Box,
  Button,
  Card,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { barcodeApi } from '../../api/barcode';
import type { ProductData } from '../../shared';
import { mapNutritionFacts } from '../../utils/scanner/nutrition';
import { HealthScoreCard } from '../../components/scanner/HealthScoreCard';
import { NutritionFactsCard } from '../../components/scanner/NutritionFactsCard';
import { PreferenceMatchesCard } from '../../components/scanner/PreferenceMatchesCard';
import { ProductInfoCard } from '../../components/scanner/ProductInfoCard';
import { ScannerCamera } from '../../components/scanner/ScannerCamera';

export const Scanner = () => {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performScan = async (shouldCloseManual = false) => {
    if (!barcode.trim()) {
      setError('Please enter a barcode or upload a photo');
      return;
    }

    setScanning(true);
    setError(null);

    try {
      const data = await barcodeApi.scan(barcode);
      setProduct(data);
      setScanned(true);
      if (shouldCloseManual) setIsManual(false);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Product not found. Please check the barcode.',
      );
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setScanned(false);
    setScanning(false);
    setIsManual(false);
    setBarcode('');
    setProduct(null);
    setError(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {scanned && product ? (
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

              <HealthScoreCard grade={product.nutritionData.nutriscore_grade} />

              <NutritionFactsCard nutritionFacts={mapNutritionFacts(product)} />

              <PreferenceMatchesCard
                preferenceMatches={[
                  {
                    label: 'Matches your preferences',
                    match: product.matchesPreferences,
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
                <Button variant="outlined" onClick={handleReset}>
                  Scan Another
                </Button>
                <Button variant="contained">Add to List</Button>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : isManual ? (
        <Box
          sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
          <Box sx={{ px: '1.5rem', pt: '3rem', pb: '1.5rem' }}>
            <Box sx={{ maxWidth: '28rem', mx: 'auto' }}>
              <IconButton onClick={() => setIsManual(false)}>
                <ArrowBackIcon />
              </IconButton>

              <Typography variant="h1">Manual Entry</Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, px: '1.5rem' }}>
            <Box sx={{ maxWidth: '28rem', mx: 'auto' }}>
              <Card sx={{ p: '2rem' }}>
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                  fullWidth
                  label="Barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />

                <Button fullWidth onClick={() => performScan(true)}>
                  {scanning ? 'Searching...' : 'Find Product'}
                </Button>
              </Card>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
          <Box sx={{ px: '1.5rem', pt: '3rem', pb: '1.5rem' }}>
            <Box sx={{ maxWidth: '28rem', mx: 'auto', textAlign: 'center' }}>
              <Typography variant="h1">Product Scanner</Typography>
              <Typography color="text.secondary">
                Upload a photo of the barcode to check its nutritional value
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, px: '1.5rem' }}>
            <Box sx={{ maxWidth: '28rem', mx: 'auto' }}>
              {error && <Alert severity="error">{error}</Alert>}

              <ScannerCamera scanning={scanning} />

              <Box
                sx={{
                  mt: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => performScan()}
                  disabled={scanning}
                  startIcon={<FileUploadIcon />}
                  sx={{ height: '3.5rem', borderRadius: '0.75rem' }}
                >
                  {scanning ? 'Processing...' : 'Upload Photo'}
                </Button>

                <Button variant="text" onClick={() => setIsManual(true)}>
                  Or enter barcode manually
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
