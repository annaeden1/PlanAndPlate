import { Box } from "@mui/material";
import type { NavItemConfig } from "../../../config/navigation";
import { NavItem } from "./NavItem";

interface DesktopNavMenuProps {
  items: NavItemConfig[];
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const DesktopNavMenu = ({ items, currentPath, onNavigate }: DesktopNavMenuProps) => {
  return (
    <Box component="nav" aria-label="Main navigation" sx={{ display: 'flex', alignItems: 'center', gap: "0.25rem" }}>
      {items.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          isActive={currentPath === item.path}
          onClick={onNavigate}
        />
      ))}
    </Box>
  );
};
