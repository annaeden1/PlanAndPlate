import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Card, Typography } from '@mui/material';
import { ActionRow } from '../../core/components/ActionRow';
import { PageHeader } from '../../core/components/PageHeader';
import { ProfileHeader } from './components/ProfileHeader';
import { StatCards } from './components/StatCards';
import { useUserProfile } from './hooks/useUserProfile';

export function Profile() {
  const { username, email, preferences, goal, budget, loading, error } =
    useUserProfile();

  // TODO: Implement sign out server logic
  const handleSignOut = () => {
    localStorage.removeItem('access-token');
    localStorage.removeItem('refresh-token');
    window.location.reload();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: '3rem' }}>
      <PageHeader title="Profile" />

      <Box sx={{ px: '1.5rem', mt: '-2rem', mb: '1.5rem' }}>
        <Box sx={{ maxWidth: '80rem', mx: 'auto' }}>
          <Card elevation={3} sx={{ p: '1.5rem' }}>
            <ProfileHeader username={username} email={email} />
            <StatCards />
          </Card>
        </Box>
      </Box>

      <Box
        sx={{
          px: '1.5rem',
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
          <Box sx={{ maxWidth: '28rem', mx: 'auto', width: '100%' }}>
            <Box>
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
                  icon={<AttachMoneyIcon />}
                  iconColor="#fbbf24"
                  iconBgColor="rgba(251, 191, 36, 0.1)"
                  title="Weekly Budget"
                  subtitle={budget}
                  topDivider
                />
              </Card>
            </Box>

            <Box sx={{ mt: '1.5rem' }}>
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
    </Box>
  );
}
