import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        background:
          'linear-gradient(135deg, rgba(62, 180, 137, 0.1) 0%, #ffffff 50%, rgba(255, 143, 90, 0.05) 100%)',
        px: '1.5rem',
        py: { xs: '2rem', sm: '3rem' },
      }}
    >
      <Box
        sx={{
          maxWidth: '80rem',
          mx: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            variant="h1"
            sx={{ fontSize: '1.875rem', mb: subtitle ? '0.5rem' : 0 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '1.125rem' }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
    </Box>
  );
}
