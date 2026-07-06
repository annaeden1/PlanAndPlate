import { Box, LinearProgress, Typography } from "@mui/material";

interface ProgressHeaderProps {
  step: number;
  totalSteps: number;
}

export function ProgressHeader({ step, totalSteps }: ProgressHeaderProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: "2rem" }}>
        <Box
          sx={{
            width: "4rem",
            height: "4rem",
            bgcolor: "primary.main",
            borderRadius: "1rem",
            mx: "auto",
            mb: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: 3,
          }}
        >
          <span
            style={{
              fontSize: "2.2rem",
              filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.35)) brightness(1.15)",
              lineHeight: 1,
            }}
          >
            🍃
          </span>
        </Box>
        <Typography variant="h1" sx={{ fontSize: "1.875rem", mb: "0.5rem" }}>
          Plan & Plate
        </Typography>
        <Typography color="text.secondary">
          Let's personalize your experience
        </Typography>
      </Box>

      <Box sx={{ mb: "2rem" }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: "0.5rem",
            borderRadius: "0.25rem",
            bgcolor: "grey.200",
            "& .MuiLinearProgress-bar": {
              bgcolor: "primary.main",
              borderRadius: "0.25rem",
            },
          }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: "0.5rem" }}
        >
          Step {step} of {totalSteps}
        </Typography>
      </Box>
    </Box>
  );
}
