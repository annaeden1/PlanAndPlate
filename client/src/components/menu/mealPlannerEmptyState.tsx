import { Box, Button, Card, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";

interface EmptyStateProps {
  selectedDay: string;
}

export function MealPlannerEmptyState({ selectedDay }: EmptyStateProps) {
  return (
    <Card sx={{ p: "3rem", textAlign: "center" }}>
      <Box sx={{ maxWidth: "28rem", mx: "auto" }}>
        <Box
          sx={{
            width: "4rem",
            height: "4rem",
            bgcolor: "grey.100",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: "1rem",
          }}
        >
          <RefreshIcon sx={{ fontSize: "2rem", color: "text.secondary" }} />
        </Box>
        <Typography variant="h3" sx={{ mb: "0.5rem" }}>
          No Meals Planned
        </Typography>
        <Typography color="text.secondary" sx={{ mb: "1.5rem" }}>
          Start planning your meals for {selectedDay} to build a healthier week!
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: "0.625rem" }}
        >
          Add Meals
        </Button>
      </Box>
    </Card>
  );
}
