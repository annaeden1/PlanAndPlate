import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { ActionRow } from '@/components/common/ActionRow';
import { PageHeader } from '@/components/common/PageHeader';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { StatCards } from '@/features/profile/components/StatCards';
import { useUserProfile } from '@/features/profile/hooks/useUserProfile';
import {
  allergiesOptions,
  dietaryOptions,
  goalsOptions,
} from '@/features/preferences/utils/preferencesOptions';

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
    setEditedDiet(diet || []);
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

    if ((oldPassword && !newPassword) || (!oldPassword && newPassword)) {
      setAccountEditError(
        'To change password, fill both current and new password.',
      );
      return;
    }

    if (oldPassword && newPassword) {
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

    const result = await updateAccount({
      username: editedUsername.trim(),
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
      diet: editedDiet,
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

      <Dialog
        open={isAccountEditOpen}
        onClose={() => !saving && setIsAccountEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Account</DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: '1rem',
            pt: '1rem !important',
            pb: '0.5rem',
          }}
        >
          <TextField
            label="Username"
            value={editedUsername}
            onChange={(event) => setEditedUsername(event.target.value)}
            fullWidth
            required
            margin="dense"
          />

          <TextField
            label="Current Password"
            type="password"
            value={oldPassword}
            onChange={(event) => {
              setOldPassword(event.target.value);
              if (currentPasswordError) {
                setCurrentPasswordError(null);
              }
            }}
            fullWidth
            margin="dense"
            error={Boolean(currentPasswordError)}
            helperText={currentPasswordError || ''}
          />

          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            fullWidth
            margin="dense"
          />

          {accountEditError && (
            <Typography color="error">{accountEditError}</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: '1.5rem', pb: '1rem' }}>
          <Button onClick={() => setIsAccountEditOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAccount}
            disabled={!canSaveProfile}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isPreferencesEditOpen}
        onClose={() => !saving && setIsPreferencesEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Preferences</DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: '1rem',
            pt: '1rem !important',
            pb: '0.5rem',
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          <FormControl fullWidth sx={{ minWidth: 0 }}>
            <InputLabel id="diet-select-label">Diets</InputLabel>
            <Select
              labelId="diet-select-label"
              multiple
              value={editedDiet}
              onChange={(event) =>
                setEditedDiet(event.target.value as string[])
              }
              input={<OutlinedInput label="Diets" />}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 320,
                    width: 'min(28rem, calc(100vw - 2rem))',
                  },
                },
              }}
              renderValue={(selected) =>
                selected
                  .map(
                    (value) =>
                      dietaryOptions.find((option) => option.id === value)
                        ?.label || value,
                  )
                  .join(', ')
              }
              sx={{
                minWidth: 0,
                '& .MuiSelect-select': {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            >
              {dietaryOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  <Checkbox checked={editedDiet.includes(option.id)} />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ minWidth: 0 }}>
            <InputLabel id="allergies-select-label">Allergies</InputLabel>
            <Select
              labelId="allergies-select-label"
              multiple
              value={editedAllergies}
              onChange={(event) =>
                setEditedAllergies(event.target.value as string[])
              }
              input={<OutlinedInput label="Allergies" />}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 320,
                    width: 'min(28rem, calc(100vw - 2rem))',
                  },
                },
              }}
              renderValue={(selected) =>
                selected
                  .map(
                    (value) =>
                      allergiesOptions.find((option) => option.id === value)
                        ?.label || value,
                  )
                  .join(', ')
              }
              sx={{
                minWidth: 0,
                '& .MuiSelect-select': {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            >
              {allergiesOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  <Checkbox checked={editedAllergies.includes(option.id)} />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="goal-select-label">Health Goal</InputLabel>
            <Select
              labelId="goal-select-label"
              value={editedGoal}
              label="Health Goal"
              onChange={(event) => setEditedGoal(event.target.value)}
            >
              <MenuItem value="">Not set</MenuItem>
              {goalsOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Weekly Budget"
            value={editedBudget}
            onChange={(event) => setEditedBudget(event.target.value)}
            type="number"
            fullWidth
            placeholder="e.g. 120"
          />

          {preferencesEditError && (
            <Typography color="error">{preferencesEditError}</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: '1.5rem', pb: '1rem' }}>
          <Button
            onClick={() => setIsPreferencesEditOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePreferences}
            disabled={!canSavePreferences}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
