import type { ReactNode } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';

type ProfileEditDialogShellProps = {
  open: boolean;
  title: string;
  saving: boolean;
  canSave: boolean;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
  contentSx?: SxProps<Theme>;
};

export function ProfileEditDialogShell({
  open,
  title,
  saving,
  canSave,
  onClose,
  onSave,
  children,
  contentSx,
}: ProfileEditDialogShellProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent
        sx={{
          display: 'grid',
          gap: '1rem',
          pt: '1rem !important',
          pb: '0.5rem',
          ...contentSx,
        }}
      >
        {children}
      </DialogContent>
      <DialogActions sx={{ px: '1.5rem', pb: '1rem' }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSave} disabled={!canSave}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
