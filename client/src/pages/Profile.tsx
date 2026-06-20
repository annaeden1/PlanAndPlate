import { Box, CircularProgress, Typography } from '@mui/material';
import { useMemo } from 'react';
import { AccountCard } from '@/features/profile/components/AccountCard';
import { DietaryPreferencesCard } from '@/features/profile/components/DietaryPreferencesCard';
import { EditAccountDialog } from '@/features/profile/components/EditAccountDialog';
import { EditPreferencesDialog } from '@/features/profile/components/EditPreferencesDialog';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { StatCards } from '@/features/profile/components/StatCards';
import { useUserProfile } from '@/features/profile/hooks/useUserProfile';
import { useProfileForms } from '@/features/profile/hooks/useProfileForms';
import { allergiesOptions } from '@/features/preferences/utils/preferencesOptions';

export function Profile() {
  const profile = useUserProfile();
  const {
    username,
    email,
    allergies,
    preferences,
    goal,
    budget,
    loading,
    saving,
    error,
  } = profile;

  const { account, preferences: prefsForm } = useProfileForms(profile);

  const allergyLabels = useMemo(
    () =>
      (allergies || []).map(
        (value) => allergiesOptions.find((option) => option.id === value)?.label || value,
      ),
    [allergies],
  );
  const goalChips = goal && goal !== 'Not set' ? [goal] : [];

  const handleSignOut = () => {
    localStorage.removeItem('access-token');
    localStorage.removeItem('refresh-token');
    window.location.reload();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: '4rem' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.375rem', animation: 'pp-slideUp .4s both' }}>
      <ProfileHeader username={username} email={email} onEdit={account.openEdit} />

      {error ? (
        <Typography color="error" sx={{ textAlign: 'center', py: '2rem' }}>
          {error}
        </Typography>
      ) : (
        <>
          <StatCards />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' },
              gap: '1.125rem',
              alignItems: 'start',
            }}
          >
            <DietaryPreferencesCard
              preferences={preferences}
              allergyLabels={allergyLabels}
              goalChips={goalChips}
              budget={budget}
              onEdit={prefsForm.openEdit}
            />
            <AccountCard
              onEditProfile={account.openEdit}
              onChangePassword={account.openEdit}
              onSignOut={handleSignOut}
            />
          </Box>
        </>
      )}

      <EditAccountDialog
        open={account.open}
        saving={saving}
        editedUsername={account.editedUsername}
        oldPassword={account.oldPassword}
        newPassword={account.newPassword}
        accountEditError={account.accountEditError}
        currentPasswordError={account.currentPasswordError}
        canSaveProfile={account.canSave}
        onClose={account.close}
        onUsernameChange={account.onUsernameChange}
        onOldPasswordChange={account.onOldPasswordChange}
        onNewPasswordChange={account.onNewPasswordChange}
        onSave={account.save}
      />

      <EditPreferencesDialog
        open={prefsForm.open}
        saving={saving}
        editedDiet={prefsForm.editedDiet}
        editedAllergies={prefsForm.editedAllergies}
        editedGoal={prefsForm.editedGoal}
        editedBudget={prefsForm.editedBudget}
        preferencesEditError={prefsForm.preferencesEditError}
        canSavePreferences={prefsForm.canSave}
        onClose={prefsForm.close}
        onDietChange={prefsForm.onDietChange}
        onAllergiesChange={prefsForm.onAllergiesChange}
        onGoalChange={prefsForm.onGoalChange}
        onBudgetChange={prefsForm.onBudgetChange}
        onSave={prefsForm.save}
      />
    </Box>
  );
}
