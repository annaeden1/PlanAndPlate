import { ProgressCard } from "@/components/common/ProgressCard";
import type { CalorieProgress } from "@/features/home/types/home";
import { Box, Typography } from "@mui/material";

interface TodaysProgressCardProps {
  calorieProgress: CalorieProgress;
}

export const TodaysProgressCard = ({
  calorieProgress,
}: TodaysProgressCardProps) => {
  const progressPercent = Math.round(
    (calorieProgress.consumed / calorieProgress.target) * 100,
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "0.75rem",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Calories Count
        </Typography>
      </Box>

      <ProgressCard
        title="Today's Progress"
        primaryText={`${calorieProgress.consumed} / ${calorieProgress.target} kcal`}
        chipLabel={progressPercent >= 80 ? "On Track" : undefined}
        progressValue={progressPercent}
      />
    </Box>
  );
};
