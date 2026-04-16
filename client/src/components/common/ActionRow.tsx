import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { IconBox } from './IconBox';

export interface ActionRowProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  iconColor?: string;
  iconBgColor?: string;
  textColor?: string;
  hideChevron?: boolean;
  topDivider?: boolean;
}

export function ActionRow({
  icon,
  title,
  subtitle,
  onClick,
  iconColor = 'primary.main',
  iconBgColor = 'rgba(62, 180, 137, 0.1)',
  textColor = 'text.primary',
  hideChevron = false,
  topDivider = false,
}: ActionRowProps) {
  return (
    <Box
      component={onClick ? 'button' : 'div'}
      onClick={onClick}
      sx={{
        width: '100%',
        p: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        bgcolor: 'transparent',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        borderTop: topDivider ? 1 : 0,
        borderColor: 'divider',
        '&:hover': onClick ? { bgcolor: 'action.hover' } : {},
      }}
    >
      <IconBox icon={icon} color={iconColor} bgColor={iconBgColor} />

      <Box sx={{ flex: 1, textAlign: 'left' }}>
        <Typography color={textColor}>{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      {onClick && !hideChevron && (
        <ChevronRightIcon sx={{ color: 'text.secondary' }} />
      )}
    </Box>
  );
}
