import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { Navbar } from "./Navbar/index";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, py: "1.5rem", px: { xs: "1rem", sm: "1.5rem" } }}>
        {children}
      </Box>
    </Box>
  );
};
