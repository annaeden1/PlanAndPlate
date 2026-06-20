import { Box, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

interface IconBoxProps {
  icon: ReactNode;
  color?: string;
  bgColor?: string;
  size?: number | string;
  iconSize?: number | string;
  shape?: 'square' | 'circle';
  sx?: SxProps<Theme>;
}

export function IconBox({
  icon,
  color = 'primary.main',
  bgColor = 'rgba(47, 191, 135, 0.12)',
  size = '2.5rem',
  iconSize = '1.25rem',
  shape = 'square',
  sx,
}: IconBoxProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: shape === 'circle' ? '50%' : '0.75rem',
        bgcolor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        '& > svg': {
          fontSize: iconSize,
          color: color,
        },
        ...sx,
      }}
    >
      {icon}
    </Box>
  );
}
