import { Box, Typography } from "@mui/material";
import AppleIcon from "@mui/icons-material/Apple";

interface NavLogoProps {
  onClick?: () => void;
}

export const NavLogo = ({ onClick }: NavLogoProps) => {
  return (
    <Box
      onClick={onClick}
      role="link"
      aria-label="Plan & Plate – Go to Home"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: "pointer",
        userSelect: "none",
        "&:hover .logo-box": {
          transform: "scale(1.06)",
        },
      }}
    >
      <Box
        className="logo-box"
        sx={{
          width: "2.625rem",
          height: "2.625rem",
          bgcolor: "primary.main",
          borderRadius: "0.625rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.18s ease",
        }}
      >
        <AppleIcon sx={{ color: "#fff", fontSize: "1.4rem" }} />
      </Box>
      <Typography variant="h6" fontWeight={700} color="text.primary" letterSpacing="-0.02em">
        Plan &amp; Plate
      </Typography>
    </Box>
  );
};
