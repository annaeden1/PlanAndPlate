import { Box, Typography, Avatar } from "@mui/material";

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning!";
  if (hour < 17) return "Good Afternoon!";
  return "Good Evening!";
};

export const GreetingHeader = () => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          {getGreeting()}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: "0.25rem" }}>
          Ready for a healthy day? 🌱
        </Typography>
      </Box>

      <Avatar
        sx={{
          width: "3rem",
          height: "3rem",
          bgcolor: "primary.main",
          fontSize: "1.5rem",
        }}
      >
        👋
      </Avatar>
    </Box>
  );
};
