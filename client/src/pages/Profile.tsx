import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Card, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { ActionRow } from '@/components/common/ActionRow';
import { PageHeader } from '@/components/common/PageHeader';
import { EditAccountDialog } from '@/features/profile/components/EditAccountDialog';
import { EditPreferencesDialog } from '@/features/profile/components/EditPreferencesDialog';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { StatCards } from '@/features/profile/components/StatCards';
import { useUserProfile } from '@/features/profile/hooks/useUserProfile';
import { allergiesOptions } from '@/features/preferences/utils/preferencesOptions';

export function Profile() {
  const {
    username,
    email,
    diet,
    allergies,
    healthGoal,
    weeklyBudget,
    preferences,
    goal,
    budget,
    loading,
    saving,
    error,
    updateAccount,
    updatePassword,
    updatePreferenceSettings,
  } = useUserProfile();
  const [isAccountEditOpen, setIsAccountEditOpen] = useState(false);
  const [isPreferencesEditOpen, setIsPreferencesEditOpen] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountEditError, setAccountEditError] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<
    string | null
  >(null);

  const [editedDiet, setEditedDiet] = useState<string[]>([]);
  const [editedAllergies, setEditedAllergies] = useState<string[]>([]);
  const [editedGoal, setEditedGoal] = useState('');
  const [editedBudget, setEditedBudget] = useState('');
  const [preferencesEditError, setPreferencesEditError] = useState<
    string | null
  >(null);

  const canSaveProfile = useMemo(
    () => editedUsername.trim().length > 0 && !saving,
    [editedUsername, saving],
  );

  const canSavePreferences = useMemo(() => !saving, [saving]);

  const allergiesDisplay = useMemo(() => {
    if (!allergies?.length) {
      return 'Not set';
    }

    return allergies
      .map(
        (value) =>
          allergiesOptions.find((option) => option.id === value)?.label ||
          value,
      )
      .join(', ');
  }, [allergies]);

  const openEditAccount = () => {
    setEditedUsername(username);
    setOldPassword('');
    setNewPassword('');
    setAccountEditError(null);
    setCurrentPasswordError(null);
    setIsAccountEditOpen(true);
  };

  const openEditPreferences = () => {
    setEditedDiet(diet?.length ? [diet[0]] : []);
    setEditedAllergies(allergies || []);
    setEditedGoal(healthGoal || '');
    setEditedBudget(
      weeklyBudget !== undefined && weeklyBudget !== null
        ? String(weeklyBudget)
        : '',
    );
    setPreferencesEditError(null);
    setIsPreferencesEditOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!editedUsername.trim()) {
      setAccountEditError('Username is required');
      return;
    }

    setAccountEditError(null);
    setCurrentPasswordError(null);

    const trimmedUsername = editedUsername.trim();
    const usernameChanged = trimmedUsername !== username.trim();
    const passwordChangeRequested = Boolean(oldPassword && newPassword);

    if ((oldPassword && !newPassword) || (!oldPassword && newPassword)) {
      setAccountEditError(
        'To change password, fill both current and new password.',
      );
      return;
    }

    if (passwordChangeRequested) {
      const passwordResult = await updatePassword({
        oldPassword,
        newPassword,
      });

      if (!passwordResult.success) {
        setCurrentPasswordError(
          passwordResult.error || 'Failed to update password',
        );
        return;
      }
    }

    if (!usernameChanged) {
      setIsAccountEditOpen(false);
      return;
    }

    const result = await updateAccount({
      username: trimmedUsername,
    });

    if (!result.success) {
      setAccountEditError(result.error || 'Failed to update profile');
      return;
    }

    setIsAccountEditOpen(false);
  };

  const handleSavePreferences = async () => {
    setPreferencesEditError(null);

    const parsedBudget = editedBudget.trim()
      ? Number.parseFloat(editedBudget)
      : undefined;

    if (parsedBudget !== undefined && Number.isNaN(parsedBudget)) {
      setPreferencesEditError('Weekly budget must be a valid number');
      return;
    }

    const result = await updatePreferenceSettings({
      diet: editedDiet.slice(0, 1),
      allergies: editedAllergies,
      healthGoal: editedGoal,
      weeklyBudget: parsedBudget,
    });

    if (!result.success) {
      setPreferencesEditError(result.error || 'Failed to update preferences');
      return;
    }

    setIsPreferencesEditOpen(false);
  };

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
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ mb: '0.75rem', px: '0.25rem' }}>
                Your Preferences
              </Typography>
              <Card>
                <ActionRow
                  icon={<PersonIcon />}
                  title="Edit Preferences"
                  subtitle="Update diets, allergies, goal, and weekly budget"
                  textColor="primary.main"
                  onClick={openEditPreferences}
                  hideChevron
                />
                <ActionRow
                  icon={<LocalDiningIcon />}
                  iconColor="#4a90d9"
                  iconBgColor="rgba(74, 144, 217, 0.1)"
                  title="Dietary Preferences"
                  subtitle={preferences.join(', ') || 'Not set'}
                  topDivider
                />
                <ActionRow
                  icon={<WarningAmberIcon />}
                  iconColor="#e57373"
                  iconBgColor="rgba(229, 115, 115, 0.1)"
                  title="Allergies"
                  subtitle={allergiesDisplay}
                  topDivider
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

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ mb: '0.75rem', px: '0.25rem' }}>
                Account Settings
              </Typography>
              <Card>
                <ActionRow
                  icon={<PersonIcon />}
                  title="Edit Account"
                  subtitle="Update name and password"
                  textColor="primary.main"
                  onClick={openEditAccount}
                  hideChevron
                />
                <ActionRow
                  icon={<LogoutIcon />}
                  iconColor="error.main"
                  iconBgColor="rgba(16, 15, 15, 0.1)"
                  textColor="error.main"
                  title="Sign Out"
                  onClick={handleSignOut}
                  topDivider
                  hideChevron
                />
              </Card>
            </Box>
          </Box>
        )}
      </Box>

      <EditAccountDialog
        open={isAccountEditOpen}
        saving={saving}
        editedUsername={editedUsername}
        oldPassword={oldPassword}
        newPassword={newPassword}
        accountEditError={accountEditError}
        currentPasswordError={currentPasswordError}
        canSaveProfile={canSaveProfile}
        onClose={() => !saving && setIsAccountEditOpen(false)}
        onUsernameChange={setEditedUsername}
        onOldPasswordChange={(value) => {
          setOldPassword(value);
          if (currentPasswordError) {
            setCurrentPasswordError(null);
          }
        }}
        onNewPasswordChange={setNewPassword}
        onSave={handleSaveAccount}
      />

      <EditPreferencesDialog
        open={isPreferencesEditOpen}
        saving={saving}
        editedDiet={editedDiet}
        editedAllergies={editedAllergies}
        editedGoal={editedGoal}
        editedBudget={editedBudget}
        preferencesEditError={preferencesEditError}
        canSavePreferences={canSavePreferences}
        onClose={() => !saving && setIsPreferencesEditOpen(false)}
        onDietChange={setEditedDiet}
        onAllergiesChange={setEditedAllergies}
        onGoalChange={setEditedGoal}
        onBudgetChange={setEditedBudget}
        onSave={handleSavePreferences}
      />
    </Box>
  );
}
