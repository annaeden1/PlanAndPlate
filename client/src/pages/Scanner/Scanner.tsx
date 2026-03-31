import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { barcodeApi } from '../../api/barcode';
import type { ProductData } from '../../shared';
import { getUserId } from '../../shared/utils/userId';
import { ProductDetailsView } from './views/ProductDetailsView';
import { ManualBarcodeEntryView } from './views/ManualBarcodeEntryView';
import { CameraUploadView } from './views/CameraUploadView';

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
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
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
        <ProductDetailsView product={product} onScanAnother={handleReset} />
      ) : isManual ? (
        <ManualBarcodeEntryView
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
        <CameraUploadView
          scanning={scanning}
          error={error}
          onUploadClick={() => performScan()}
          onManualEntryClick={() => {
            setIsManual(true);
            setError(null);
          }}
        />
      )}
    </Box>
  );
};
