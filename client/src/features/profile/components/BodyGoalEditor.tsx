import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';
import type { BodyStats, OnboardingData } from '@/shared';
import { userManagementApi } from '@/features/auth/api/auth';
import { ActivityStep } from '@/features/preferences/components/ActivityStep';
import { BodyStatsStep } from '@/features/preferences/components/BodyStatsStep';
import { GoalsStep } from '@/features/preferences/components/GoalsStep';
import { getUserId } from '@/shared/utils/userId';

interface BodyGoalEditorProps {
  open: boolean;
  onClose: () => void;
  initialStats?: Partial<BodyStats>;
  initialGoal: string;
}

const isComplete = (s: Partial<BodyStats>): boolean =>
  !!s.weightKg &&
  !!s.heightCm &&
  !!s.age &&
  (s.gender === 'male' || s.gender === 'female') &&
  !!s.activityLevel;

export function BodyGoalEditor({
  open,
  onClose,
  initialStats,
  initialGoal,
}: BodyGoalEditorProps) {
  const [bodyStats, setBodyStats] = useState<Partial<BodyStats>>(
    initialStats ?? {},
  );
  const [goal, setGoal] = useState(initialGoal);
  const [saving, setSaving] = useState(false);

  const handlePatch = (patch: Partial<BodyStats>) =>
    setBodyStats((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    const userId = getUserId();
    const token = localStorage.getItem('access-token');
    if (!userId) return;

    setSaving(true);
    try {
      const prefs: Record<string, unknown> = { healthGoal: goal };
      if (isComplete(bodyStats)) prefs.bodyStats = bodyStats;

      await userManagementApi.updatePreferences(
        userId,
        { preferences: prefs } as unknown as OnboardingData,
        token,
      );
      window.location.reload();
    } catch (err) {
      console.error('Failed to save body & goal:', err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Body & Goal</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <BodyStatsStep value={bodyStats} onChange={handlePatch} />
          <ActivityStep
            activityLevel={bodyStats.activityLevel ?? ''}
            onChange={(activityLevel) =>
              handlePatch({
                activityLevel: activityLevel as BodyStats['activityLevel'],
              })
            }
          />
          <GoalsStep goal={goal} onChange={setGoal} stats={bodyStats} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !isComplete(bodyStats) || !goal}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
