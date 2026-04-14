import { ProgressCard } from "@/components/common/ProgressCard";
import type { CalorieProgress } from "@/features/home/types/home";

interface TodaysProgressCardProps {
  calorieProgress: CalorieProgress;
}

export const TodaysProgressCard = ({ calorieProgress }: TodaysProgressCardProps) => {
  const progressPercent = Math.round(
    (calorieProgress.consumed / calorieProgress.target) * 100
  );

  return (
    <ProgressCard
      title="Today's Progress"
      primaryText={`${calorieProgress.consumed} / ${calorieProgress.target} kcal`}
      chipLabel={progressPercent >= 80 ? "On Track" : undefined}
      progressValue={progressPercent}
    />
  );
};
