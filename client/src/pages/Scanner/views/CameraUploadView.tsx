import FileUploadIcon from '@mui/icons-material/FileUpload';
import { Alert, Box, Button, Typography } from '@mui/material';
import { ScannerCamera } from '../../../components/scanner/ScannerCamera';

interface CameraUploadViewProps {
  scanning: boolean;
  error: string | null;
  onUploadClick: () => void;
  onManualEntryClick: () => void;
}

export const CameraUploadView = ({
  scanning,
  error,
  onUploadClick,
  onManualEntryClick,
}: CameraUploadViewProps) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
              onClick={onUploadClick}
              disabled={scanning}
              startIcon={<FileUploadIcon />}
              sx={{ height: '3.5rem', borderRadius: '0.75rem' }}
            >
              {scanning ? 'Processing...' : 'Upload Photo'}
            </Button>

            <Button variant="text" onClick={onManualEntryClick}>
              Or enter barcode manually
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
