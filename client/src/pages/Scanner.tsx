import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { barcodeApi } from '@/features/scanner/api/barcode';
import type { ProductData } from '@/shared';
import { getUserId } from '@/shared/utils/userId';
import { ProductDetails } from '@/features/scanner/components/ProductDetails';
import { ManualBarcodeEntry } from '@/features/scanner/components/ManualBarcodeEntry';
import { CameraUpload } from '@/features/scanner/components/CameraUpload';
import { extractBarcodeFromImage } from '@/features/scanner/services/barcodeDetectorService';
import { colors } from '@/core/theme/tokens';

const IdlePanel = () => (
  <Box
    sx={{
      height: '100%',
      minHeight: 360,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      bgcolor: '#fff',
      borderRadius: '1.625rem',
      border: '2px dashed rgba(20,40,30,.12)',
      p: '1.875rem',
    }}
  >
    <Box sx={{ fontSize: 46, opacity: 0.45, animation: 'pp-floaty 4s ease-in-out infinite' }}>📷</Box>
    <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.ink, mt: '0.875rem' }}>
      Scan a product to begin
    </Typography>
    <Typography sx={{ fontSize: 13, color: colors.textMuted, mt: '0.375rem', maxWidth: 280 }}>
      We'll check its health score and how it fits your goals.
    </Typography>
  </Box>
);

export const Scanner = () => {
  const userId = getUserId();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!userId) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: '6rem' }}>
        <Typography variant="h5">Please log in to use the scanner</Typography>
      </Box>
    );
  }

  const performScan = async (shouldCloseManual = false) => {
    if (!barcode.trim()) {
      setError('Please enter a barcode or upload a photo');
      return;
    }
    setScanning(true);
    setError(null);
    try {
      const data = await barcodeApi.scan(userId, barcode);
      setProduct(data);
      setScanned(true);
      if (shouldCloseManual) setIsManual(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Product not found. Please check the barcode.');
    } finally {
      setScanning(false);
    }
  };

  const handlePhotoSelected = async (file: File) => {
    setScanning(true);
    setError(null);
    try {
      const extractedBarcode = await extractBarcodeFromImage(file);
      setBarcode(extractedBarcode);
      const data = await barcodeApi.scan(userId, extractedBarcode);
      setProduct(data);
      setScanned(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error: string } }; message?: string };
      setError(
        e.response?.data?.error ||
          e.message ||
          'Could not extract barcode from image. Please make sure the barcode is visible and clear.',
      );
      setBarcode('');
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: '24px',
        alignItems: 'start',
        animation: 'pp-slideUp .4s both',
      }}
    >
      {/* left: scanner controls */}
      <Box sx={{ minWidth: 0 }}>
        {isManual ? (
          <ManualBarcodeEntry
            barcode={barcode}
            scanning={scanning}
            error={error}
            onBarcodeChange={setBarcode}
            onSubmit={() => performScan(true)}
            onBack={() => {
              setIsManual(false);
              setError(null);
            }}
          />
        ) : (
          <CameraUpload
            scanning={scanning}
            error={error}
            onPhotoSelected={handlePhotoSelected}
            onManualEntryClick={() => {
              setIsManual(true);
              setError(null);
            }}
          />
        )}
      </Box>

      {/* right: result */}
      <Box sx={{ minWidth: 0 }}>
        {scanned && product ? (
          <ProductDetails product={product} onScanAnother={handleReset} />
        ) : (
          <IdlePanel />
        )}
      </Box>
    </Box>
  );
};
