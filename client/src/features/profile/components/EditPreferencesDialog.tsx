import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  allergiesOptions,
  dietaryOptions,
  goalsOptions,
} from '@/features/preferences/utils/preferencesOptions';
import { ProfileEditDialogShell } from './ProfileEditDialogShell';

type EditPreferencesDialogProps = {
  open: boolean;
  saving: boolean;
  editedDiet: string[];
  editedAllergies: string[];
  editedGoal: string;
  editedBudget: string;
  preferencesEditError: string | null;
  canSavePreferences: boolean;
  onClose: () => void;
  onDietChange: (value: string[]) => void;
  onAllergiesChange: (value: string[]) => void;
  onGoalChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onSave: () => void;
};

export function EditPreferencesDialog({
  open,
  saving,
  editedDiet,
  editedAllergies,
  editedGoal,
  editedBudget,
  preferencesEditError,
  canSavePreferences,
  onClose,
  onDietChange,
  onAllergiesChange,
  onGoalChange,
  onBudgetChange,
  onSave,
}: EditPreferencesDialogProps) {
  return (
    <ProfileEditDialogShell
      open={open}
      title="Edit Preferences"
      saving={saving}
      canSave={canSavePreferences}
      onClose={onClose}
      onSave={onSave}
      contentSx={{ minWidth: 0, overflowX: 'hidden' }}
    >
      <FormControl fullWidth sx={{ minWidth: 0 }}>
        <InputLabel id="diet-select-label">Diets</InputLabel>
        <Select
          labelId="diet-select-label"
          value={editedDiet[0] || ''}
          label="Diets"
          onChange={(event) =>
            onDietChange(event.target.value ? [event.target.value] : [])
          }
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 320,
                width: 'min(28rem, calc(100vw - 2rem))',
              },
            },
          }}
          sx={{
            minWidth: 0,
            '& .MuiSelect-select': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        >
          <MenuItem value="">No preference</MenuItem>
          {dietaryOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label}
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
            onAllergiesChange(event.target.value as string[])
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
          onChange={(event) => onGoalChange(event.target.value)}
        >
          <MenuItem value="">No specific goal</MenuItem>
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
        onChange={(event) => onBudgetChange(event.target.value)}
        type="number"
        fullWidth
        placeholder="e.g. 120"
      />

      {preferencesEditError && (
        <Typography color="error">{preferencesEditError}</Typography>
      )}
    </ProfileEditDialogShell>
  );
}
