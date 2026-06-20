import { useCallback, useState } from 'react';

export type SnackbarSeverity = 'success' | 'error';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

const CLOSED: SnackbarState = { open: false, message: '', severity: 'success' };

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>(CLOSED);

  const showSuccess = useCallback(
    (message: string) => setSnackbar({ open: true, message, severity: 'success' }),
    [],
  );
  const showError = useCallback(
    (message: string) => setSnackbar({ open: true, message, severity: 'error' }),
    [],
  );
  const close = useCallback(() => setSnackbar((prev) => ({ ...prev, open: false })), []);

  return { snackbar, showSuccess, showError, close };
}
