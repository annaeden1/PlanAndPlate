import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { barcodeApi } from '../../api/barcode';
import type { ProductData } from '../../shared';
import { getUserId } from '../../shared/utils/userId';
import { ProductDetailsView } from './views/ProductDetailsView';
import { ManualBarcodeEntryView } from './views/ManualBarcodeEntryView';
import { CameraUploadView } from './views/CameraUploadView';
import { extractBarcodeFromImage } from '../../utils/scanner/barcodeDetector';

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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error: string } } };
      setError(
        error.response?.data?.error ||
          'Product not found. Please check the barcode.',
      );
    } finally {
      setScanning(false);
    }
  };

  const handlePhotoSelected = async (file: File) => {
    setScanning(true);
    setError(null);

    try {
      // Extract barcode from the image
      const extractedBarcode = await extractBarcodeFromImage(file);
      setBarcode(extractedBarcode);

      // Perform scan with the extracted barcode
      const data = await barcodeApi.scan(userId, extractedBarcode);
      setProduct(data);
      setScanned(true);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error: string } };
        message?: string;
      };
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Could not extract barcode from image. Please make sure the barcode is visible and clear.';
      setError(errorMessage);
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
          onPhotoSelected={handlePhotoSelected}
          onManualEntryClick={() => {
            setIsManual(true);
            setError(null);
          }}
        />
      )}
    </Box>
  );
};
