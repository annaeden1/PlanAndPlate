import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Card, Typography } from '@mui/material';
import { useState } from 'react';
import { calcTargets } from '@/shared';
import { ActionRow } from '@/components/common/ActionRow';
import { PageHeader } from '@/components/common/PageHeader';
import { BodyGoalEditor } from '@/features/profile/components/BodyGoalEditor';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { StatCards } from '@/features/profile/components/StatCards';
import { useUserProfile } from '@/features/profile/hooks/useUserProfile';

export function Profile() {
  const {
    username,
    email,
    preferences,
    goal,
    budget,
    bodyStats,
    healthGoalId,
    loading,
    error,
  } = useUserProfile();
  const [editorOpen, setEditorOpen] = useState(false);

  const targets = calcTargets(bodyStats, healthGoalId);
  const bodyGoalSubtitle = targets
    ? `${targets.targetCalories.toLocaleString()} kcal/day · ${targets.proteinGramsPerDay}g protein`
    : 'Set your body stats to get a calorie target';

  // TODO: Implement sign out server logic
  const handleSignOut = () => {
    localStorage.removeItem('access-token');
    localStorage.removeItem('refresh-token');
    window.location.reload();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: '3rem' }}>
      <PageHeader title="Profile" />

      <Box sx={{ px: { xs: '1rem', sm: '1.5rem' }, mt: '-2rem', mb: '1.5rem' }}>
        <Box sx={{ maxWidth: '80rem', mx: 'auto' }}>
          <Card elevation={3} sx={{ p: '1.5rem' }}>
            <ProfileHeader username={username} email={email} />
            <StatCards />
          </Card>
        </Box>
      </Box>

      <Box
        sx={{
          px: { xs: '1rem', sm: '1.5rem' },
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '3rem' }}>
            <Typography>Loading profile...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '3rem' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box 
            sx={{ 
              maxWidth: '80rem', 
              mx: 'auto', 
              width: '100%',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: '2rem',
              alignItems: 'start'
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ mb: '0.75rem', px: '0.25rem' }}>
                Your Preferences
              </Typography>
              <Card>
                <ActionRow
                  icon={<LocalDiningIcon />}
                  title="Dietary Preferences"
                  subtitle={preferences.join(', ') || 'Not set'}
                />
                <ActionRow
                  icon={<FavoriteIcon />}
                  iconColor="warning.main"
                  iconBgColor="rgba(255, 143, 90, 0.1)"
                  title="Health Goals"
                  subtitle={goal}
                  topDivider
                />
                <ActionRow
                  icon={<FitnessCenterIcon />}
                  iconColor="primary.main"
                  iconBgColor="rgba(62, 180, 137, 0.1)"
                  title="Body & Goal"
                  subtitle={bodyGoalSubtitle}
                  onClick={() => setEditorOpen(true)}
                  topDivider
                />
                <ActionRow
                  icon={<AttachMoneyIcon />}
                  iconColor="#fbbf24"
                  iconBgColor="rgba(251, 191, 36, 0.1)"
                  title="Weekly Budget"
                  subtitle={budget}
                  topDivider
                />
              </Card>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ mb: '0.75rem', px: '0.25rem' }}>
                Account Settings
              </Typography>
              <Card>
                <ActionRow
                  icon={<LogoutIcon />}
                  iconColor="error.main"
                  iconBgColor="rgba(16, 15, 15, 0.1)"
                  textColor="error.main"
                  title="Sign Out"
                  onClick={handleSignOut}
                  hideChevron
                />
                <ActionRow
                  icon={<PersonIcon />}
                  iconColor="text.primary"
                  iconBgColor="grey.100"
                  title="Reset Onboarding"
                  subtitle="See the welcome flow again"
                  onClick={() => {}}
                  topDivider
                  hideChevron
                />
                <ActionRow
                  icon={<LockIcon />}
                  iconColor="text.primary"
                  iconBgColor="grey.100"
                  title="Settings"
                  subtitle="Manage your account settings"
                  onClick={() => () => {}}
                  topDivider
                />
              </Card>
            </Box>
          </Box>
        )}
      </Box>

      {editorOpen && (
        <BodyGoalEditor
          open
          onClose={() => setEditorOpen(false)}
          initialStats={bodyStats}
          initialGoal={healthGoalId}
        />
      )}
    </Box>
  );
}
