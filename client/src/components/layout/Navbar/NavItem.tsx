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
      startIcon={<Icon />}
      sx={{
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
      <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
        {item.label}
      </Box>
    </Button>
  );
};
