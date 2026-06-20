import FileUploadIcon from '@mui/icons-material/FileUpload';
import { Alert, Box, Typography } from '@mui/material';
import { useRef } from 'react';
import { ScannerCamera } from '@/features/scanner/components/ScannerCamera';
import { colors, gradients, shadows } from '@/core/theme/tokens';

interface CameraUploadProps {
  scanning: boolean;
  error: string | null;
  onPhotoSelected: (file: File) => void;
  onManualEntryClick: () => void;
}

export const CameraUpload = ({
  scanning,
  error,
  onPhotoSelected,
  onManualEntryClick,
}: CameraUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onPhotoSelected(file);
    event.target.value = '';
  };

  return (
    <Box sx={{ animation: 'pp-slideUp .5s both' }}>
      {error && (
        <Alert severity="error" sx={{ mb: '0.875rem', borderRadius: '0.875rem' }}>
          {error}
        </Alert>
      )}

      <ScannerCamera scanning={scanning} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={scanning}
      />

      <Box
        onClick={scanning ? undefined : () => fileInputRef.current?.click()}
        sx={{
          mt: '1rem',
          background: gradients.cta,
          borderRadius: '1rem',
          p: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.625rem',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          cursor: scanning ? 'default' : 'pointer',
          opacity: scanning ? 0.85 : 1,
          boxShadow: shadows.cta,
          transition: 'transform .15s',
          '&:hover': scanning ? {} : { transform: 'translateY(-0.125rem)' },
        }}
      >
        <FileUploadIcon sx={{ fontSize: 20 }} />
        {scanning ? 'Scanning…' : 'Upload barcode photo'}
      </Box>

      <Typography
        onClick={onManualEntryClick}
        sx={{
          mt: '0.875rem',
          textAlign: 'center',
          fontSize: 13.5,
          fontWeight: 600,
          color: colors.greenLeaf,
          cursor: 'pointer',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        Or enter barcode manually
      </Typography>
    </Box>
  );
};
