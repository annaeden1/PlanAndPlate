import { AppBar, Toolbar, Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../../../config/navigation";
import { NavLogo } from "./NavLogo";
import { DesktopNavMenu } from "./DesktopNavMenu";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          maxWidth: "80rem",
          mx: "auto",
          width: "100%",
          px: { xs: "1rem", sm: "1.5rem" },
          minHeight: { xs: "3.5rem", sm: "4rem" },
        }}
      >
        <NavLogo onClick={() => navigate("/")} />
        <Box sx={{ flexGrow: 1 }} />
        <DesktopNavMenu
          items={NAV_ITEMS}
          currentPath={location.pathname}
          onNavigate={navigate}
        />
      </Toolbar>
    </AppBar>
  );
};
