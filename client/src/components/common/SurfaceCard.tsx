import { Box, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { colors, shadows } from '@/core/theme/tokens';

interface SurfaceCardProps {
  children: ReactNode;

  padding?: string | number;

  radius?: string | number;

  shadow?: string | null;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

export function SurfaceCard({
  children,
  padding = '1.5rem',
  radius = '1.375rem',
  shadow = shadows.soft,
  onClick,
  sx,
}: SurfaceCardProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: colors.card,
        borderRadius: radius,
        p: padding,
        border: `1px solid ${colors.cardBorder}`,
        ...(shadow ? { boxShadow: shadow } : {}),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
