import type { ElementType } from "react";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import PersonIcon from "@mui/icons-material/Person";

export interface NavItemConfig {
  id: string;
  icon: ElementType;
  label: string;
  path: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: "home", icon: HomeIcon, label: "Home", path: "/" },
  { id: "planner", icon: CalendarMonthIcon, label: "Planner", path: "/planner" },
  { id: "cart", icon: ShoppingCartIcon, label: "Cart", path: "/cart" },
  { id: "scanner", icon: QrCodeScannerIcon, label: "Scanner", path: "/scanner" },
  { id: "profile", icon: PersonIcon, label: "Profile", path: "/profile" },
];
