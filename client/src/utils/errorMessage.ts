import axios from 'axios';

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message;
  }
  return err instanceof Error ? err.message : String(err);
};
