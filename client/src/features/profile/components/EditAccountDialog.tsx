import { TextField, Typography } from '@mui/material';
import { ProfileEditDialogShell } from './ProfileEditDialogShell';

type EditAccountDialogProps = {
  open: boolean;
  saving: boolean;
  editedUsername: string;
  oldPassword: string;
  newPassword: string;
  accountEditError: string | null;
  currentPasswordError: string | null;
  newPasswordError: string | null;
  canSaveProfile: boolean;
  onClose: () => void;
  onUsernameChange: (value: string) => void;
  onOldPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onSave: () => void;
};

export function EditAccountDialog({
  open,
  saving,
  editedUsername,
  oldPassword,
  newPassword,
  accountEditError,
  currentPasswordError,
  newPasswordError,
  canSaveProfile,
  onClose,
  onUsernameChange,
  onOldPasswordChange,
  onNewPasswordChange,
  onSave,
}: EditAccountDialogProps) {
  return (
    <ProfileEditDialogShell
      open={open}
      title="Edit Account"
      saving={saving}
      canSave={canSaveProfile}
      onClose={onClose}
      onSave={onSave}
    >
      <TextField
        label="Username"
        value={editedUsername}
        onChange={(event) => onUsernameChange(event.target.value)}
        fullWidth
        required
        margin="dense"
      />

      <TextField
        label="Current Password"
        type="password"
        value={oldPassword}
        onChange={(event) => onOldPasswordChange(event.target.value)}
        fullWidth
        margin="dense"
        error={Boolean(currentPasswordError)}
        helperText={currentPasswordError || ''}
      />

      <TextField
        label="New Password"
        type="password"
        value={newPassword}
        onChange={(event) => onNewPasswordChange(event.target.value)}
        fullWidth
        margin="dense"
        error={Boolean(newPasswordError)}
        helperText={newPasswordError || ''}
      />

      {accountEditError && (
        <Typography color="error">{accountEditError}</Typography>
      )}
    </ProfileEditDialogShell>
  );
}
