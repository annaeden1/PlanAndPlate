import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { Alert, Box, Card, Typography } from '@mui/material';
import type { BodyStats } from '@/shared';
import { calcTargets, GOAL_MODIFIERS } from '@/shared';

interface GoalSummaryProps {
  stats: Partial<BodyStats>;
  goal: string;
}

const DISCLAIMER =
  'These numbers are estimates from a standard formula (Mifflin–St Jeor) and ' +
  'your inputs. Everyone’s metabolism differs, so treat them as a rough guide. ' +
  'This is not medical advice and we are not responsible for any health ' +
  'outcomes — consult a professional before making dietary changes.';

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
      {icon}
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

export function GoalSummary({ stats, goal }: GoalSummaryProps) {
  const targets = calcTargets(stats, goal);
  if (!targets) return null;

  const isHealthy = GOAL_MODIFIERS[goal]?.healthyNote;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card
        sx={{
          p: '1.25rem',
          bgcolor: 'rgba(62, 180, 137, 0.06)',
          border: '1px solid',
          borderColor: 'primary.main',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: '0.75rem' }}>
          Estimated maintenance: {targets.maintenance.toLocaleString()} kcal/day
        </Typography>
        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <Metric
            icon={<LocalFireDepartmentIcon color="primary" />}
            value={`${targets.targetCalories.toLocaleString()} kcal`}
            label="Daily target"
          />
          <Metric
            icon={<RestaurantIcon color="primary" />}
            value={`${targets.proteinGramsPerDay} g`}
            label="Protein/day"
          />
        </Box>
        {isHealthy && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: '0.75rem' }}>
            We’ll steer your plan toward healthier recipes where possible.
          </Typography>
        )}
      </Card>

      <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
        {DISCLAIMER}
      </Alert>
    </Box>
  );
}
