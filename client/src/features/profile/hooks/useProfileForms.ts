import { useMemo, useState } from 'react';
import type { UserProfile } from '@/features/profile/types/profile';

export function useProfileForms(profile: UserProfile) {
  const {
    username,
    diet,
    allergies,
    healthGoal,
    weeklyBudget,
    saving,
    updateAccount,
    updatePassword,
    updatePreferenceSettings,
  } = profile;

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [editedDiet, setEditedDiet] = useState<string[]>([]);
  const [editedAllergies, setEditedAllergies] = useState<string[]>([]);
  const [editedGoal, setEditedGoal] = useState('');
  const [editedBudget, setEditedBudget] = useState('');
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  const canSaveProfile = useMemo(
    () => editedUsername.trim().length > 0 && !saving,
    [editedUsername, saving],
  );
  const canSavePreferences = useMemo(() => !saving, [saving]);

  const openAccount = () => {
    setEditedUsername(username);
    setOldPassword('');
    setNewPassword('');
    setAccountError(null);
    setCurrentPasswordError(null);
    setIsAccountOpen(true);
  };

  const openPreferences = () => {
    setEditedDiet(diet?.length ? [diet[0]] : []);
    setEditedAllergies(allergies || []);
    setEditedGoal(healthGoal || '');
    setEditedBudget(weeklyBudget != null ? String(weeklyBudget) : '');
    setPreferencesError(null);
    setIsPreferencesOpen(true);
  };

  const saveAccount = async () => {
    if (!editedUsername.trim()) {
      setAccountError('Username is required');
      return;
    }
    setAccountError(null);
    setCurrentPasswordError(null);

    const trimmedUsername = editedUsername.trim();
    const usernameChanged = trimmedUsername !== username.trim();
    const passwordChangeRequested = Boolean(oldPassword && newPassword);

    if ((oldPassword && !newPassword) || (!oldPassword && newPassword)) {
      setAccountError('To change password, fill both current and new password.');
      return;
    }

    if (passwordChangeRequested) {
      const passwordResult = await updatePassword({ oldPassword, newPassword });
      if (!passwordResult.success) {
        setCurrentPasswordError(passwordResult.error || 'Failed to update password');
        return;
      }
    }

    if (!usernameChanged) {
      setIsAccountOpen(false);
      return;
    }

    const result = await updateAccount({ username: trimmedUsername });
    if (!result.success) {
      setAccountError(result.error || 'Failed to update profile');
      return;
    }
    setIsAccountOpen(false);
  };

  const savePreferences = async () => {
    setPreferencesError(null);
    const parsedBudget = editedBudget.trim() ? Number.parseFloat(editedBudget) : undefined;
    if (parsedBudget !== undefined && Number.isNaN(parsedBudget)) {
      setPreferencesError('Weekly budget must be a valid number');
      return;
    }
    const result = await updatePreferenceSettings({
      diet: editedDiet.slice(0, 1),
      allergies: editedAllergies,
      healthGoal: editedGoal,
      weeklyBudget: parsedBudget,
    });
    if (!result.success) {
      setPreferencesError(result.error || 'Failed to update preferences');
      return;
    }
    setIsPreferencesOpen(false);
  };

  const onOldPasswordChange = (value: string) => {
    setOldPassword(value);
    if (currentPasswordError) setCurrentPasswordError(null);
  };

  return {
    account: {
      open: isAccountOpen,
      editedUsername,
      oldPassword,
      newPassword,
      accountEditError: accountError,
      currentPasswordError,
      canSave: canSaveProfile,
      openEdit: openAccount,
      close: () => !saving && setIsAccountOpen(false),
      onUsernameChange: setEditedUsername,
      onOldPasswordChange,
      onNewPasswordChange: setNewPassword,
      save: saveAccount,
    },
    preferences: {
      open: isPreferencesOpen,
      editedDiet,
      editedAllergies,
      editedGoal,
      editedBudget,
      preferencesEditError: preferencesError,
      canSave: canSavePreferences,
      openEdit: openPreferences,
      close: () => !saving && setIsPreferencesOpen(false),
      onDietChange: setEditedDiet,
      onAllergiesChange: setEditedAllergies,
      onGoalChange: setEditedGoal,
      onBudgetChange: setEditedBudget,
      save: savePreferences,
    },
  };
}
