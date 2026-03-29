import { Card, CardContent, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

interface SelectableCardProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
}

export function SelectableCard({
  selected,
  onClick,
  children,
  sx,
  contentSx,
}: SelectableCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: selected ? '2px solid' : '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'rgba(62, 180, 137, 0.05)' : 'background.paper',
        '&:hover': { boxShadow: 2 },
        ...sx,
      }}
    >
      <CardContent
        sx={{
          py: '1rem',
          px: '1rem',
          '&:last-child': { pb: '1rem' },
          ...contentSx,
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
}
