import { Box, Typography } from '@mui/material';
import { colors } from '@/core/theme/tokens';

interface ScannerCameraProps {
  scanning: boolean;
}

const Bracket = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const base = {
    position: 'absolute' as const,
    width: 42,
    height: 42,
    borderColor: colors.mint,
  };
  const map = {
    tl: { top: 46, left: 60, borderTop: '3px solid', borderLeft: '3px solid', borderRadius: '0.375rem 0 0 0' },
    tr: { top: 46, right: 60, borderTop: '3px solid', borderRight: '3px solid', borderRadius: '0 0.375rem 0 0' },
    bl: { bottom: 60, left: 60, borderBottom: '3px solid', borderLeft: '3px solid', borderRadius: '0 0 0 0.375rem' },
    br: { bottom: 60, right: 60, borderBottom: '3px solid', borderRight: '3px solid', borderRadius: '0 0 0.375rem 0' },
  };
  return <Box sx={{ ...base, ...map[pos] }} />;
};

export const ScannerCamera = ({ scanning }: ScannerCameraProps) => {
  return (
    <Box
      sx={{
        position: 'relative',
        height: 360,
        borderRadius: '1.625rem',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 40%,#1d2b24,#0c1713)',
        boxShadow: '0 1.25rem 2.75rem -1.375rem rgba(0,0,0,.55)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 120,
          opacity: 0.16,
          animation: 'pp-floaty 5s ease-in-out infinite',
        }}
      >
        🥫
      </Box>

      <Bracket pos="tl" />
      <Bracket pos="tr" />
      <Bracket pos="bl" />
      <Bracket pos="br" />

      {scanning && (
        <Box
          sx={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: '50%',
            height: 3,
            borderRadius: '0.1875rem',
            background: 'linear-gradient(90deg,transparent,#3fe39b,transparent)',
            boxShadow: '0 0 1.125rem #3fe39b',
            animation: 'pp-scanline 1.1s ease-in-out infinite alternate',
          }}
        />
      )}

      <Typography
        sx={{
          position: 'absolute',
          bottom: 22,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 13,
          color: 'rgba(255,255,255,.6)',
        }}
      >
        {scanning ? 'Hold steady…' : 'Point at a barcode or upload a photo'}
      </Typography>
    </Box>
  );
};
