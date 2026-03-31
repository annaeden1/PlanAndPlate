import { Box, Card, Typography } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface ScannerCameraProps {
  scanning: boolean;
}

export const ScannerCamera = ({ scanning }: ScannerCameraProps) => {
  return (
    <Card
      sx={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        bgcolor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!scanning ? (
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: '5rem',
              height: '5rem',
              mx: 'auto',
              mb: '1rem',
              borderRadius: '50%',
              bgcolor: 'rgba(62, 180, 137, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileUploadIcon
              sx={{ fontSize: '2.5rem', color: 'primary.main' }}
            />
          </Box>
          <Typography color="text.secondary" sx={{ mb: '1.5rem' }}>
            No photo selected
          </Typography>
          <Box
            sx={{
              width: '12rem',
              height: '12rem',
              mx: 'auto',
              border: '4px dashed',
              borderColor: 'primary.main',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <InsertDriveFileIcon
              sx={{ fontSize: '4rem', color: 'primary.main' }}
            />
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: '12rem',
              height: '12rem',
              mx: 'auto',
              border: '4px solid',
              borderColor: 'primary.main',
              borderRadius: '1rem',
              bgcolor: 'rgba(62, 180, 137, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          >
            <InsertDriveFileIcon
              sx={{
                fontSize: '4rem',
                color: 'primary.main',
                animation: 'bounce 0.5s infinite',
                '@keyframes bounce': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                },
              }}
            />
          </Box>
          <Typography color="primary.main" sx={{ mt: '1rem' }}>
            Uploading...
          </Typography>
        </Box>
      )}
    </Card>
  );
};
