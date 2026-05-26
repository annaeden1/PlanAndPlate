import { Button, Box } from "@mui/material";
import type { NavItemConfig } from "../../../config/navigation";

interface NavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  onClick: (id: string) => void;
}

export const NavItem = ({ item, isActive, onClick }: NavItemProps) => {
  const Icon = item.icon;

  return (
    <Button
      onClick={() => onClick(item.path)}
      sx={{
        minWidth: { xs: 'auto', md: '64px' },
        p: { xs: '0.5rem', md: '0.5rem 1rem' },
        textTransform: 'none',
        fontWeight: 500,
        color: isActive ? 'primary.main' : 'text.secondary',
        bgcolor: isActive ? 'rgba(62, 180, 137, 0.1)' : 'transparent',
        '&:hover': {
          bgcolor: isActive ? 'rgba(62, 180, 137, 0.15)' : 'action.hover',
          color: isActive ? 'primary.main' : 'text.primary',
        },
      }}
    >
      <Icon sx={{ mr: { xs: 0, md: 1 } }} />
      <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
        {item.label}
      </Box>
    </Button>
  );
};
