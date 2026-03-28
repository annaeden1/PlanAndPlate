import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  TextField,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface AuthFormProps {
  isSignUp: boolean;
  onSubmit: (e: React.FormEvent, data: any) => void;
}

export function AuthForm({ isSignUp, onSubmit }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  return (
    <Box component="form" onSubmit={(e) => onSubmit(e, formData)}>
      {isSignUp && (
        <TextField
          fullWidth
          label="Full Name"
          placeholder="Jane Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required={isSignUp}
          sx={{ mb: '1rem' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      )}

      <TextField
        fullWidth
        label="Email"
        type="email"
        placeholder="jane@example.com"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        sx={{ mb: '1rem' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        sx={{ mb: '1rem' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {!isSignUp && (
        <Box sx={{ textAlign: 'right', mb: '1rem' }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            color="primary"
            underline="hover"
          >
            Forgot password?
          </Link>
        </Box>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        sx={{ py: '0.75rem', fontSize: '1rem' }}
      >
        {isSignUp ? 'Create Account' : 'Sign In'}
      </Button>
    </Box>
  );
}
