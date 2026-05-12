import { Box, Card, Typography } from "@mui/material";

interface RecipeInstructionsProps {
  steps?: string[];
}

export const RecipeInstructions = ({ steps }: RecipeInstructionsProps) => (
  <Box>
    <Typography variant="h2" sx={{ mb: "1rem" }}>Instructions</Typography>
    <Card sx={{ p: "1.5rem" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {steps?.map((step: string, idx: number) => (
          <Box key={idx} sx={{ display: "flex", gap: "1rem" }}>
            <Box
              sx={{
                flexShrink: 0,
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                bgcolor: "rgba(62, 180, 137, 0.1)",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              {idx + 1}
            </Box>
            <Typography sx={{ flex: 1, pt: "0.25rem" }}>{step}</Typography>
          </Box>
        ))}
      </Box>
    </Card>
  </Box>
);
