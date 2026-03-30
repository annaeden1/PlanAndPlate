import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AppleIcon from '@mui/icons-material/Apple';
import { AuthForm } from './components/AuthForm';
import { AuthTabs } from './components/AuthTabs';
import { userManagementApi } from '../../components/api/auth';

interface AuthFormData {
  name?: string;
  email: string;
  password: string;
}

interface AuthTokenData {
  accessToken: string;
  refreshToken: string;
}

interface AuthProps {
  onAuthComplete: (formData: AuthTokenData, isSignUp: boolean) => void;
}

export function Auth({ onAuthComplete }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = async (e: React.FormEvent, formData: AuthFormData) => {
    e.preventDefault();

    try {
      const response = isSignUp
        ? await userManagementApi.signup(formData)
        : await userManagementApi.signin(formData);
      if (response.tokens) {
        onAuthComplete(
          {
            accessToken: response.tokens.token,
            refreshToken: response.tokens.refreshToken,
          },
          isSignUp,
        );
      } else {
        setErrorMessage('שם משתמש או סיסמה שגויים');
        setShowError(true);
      }
    } catch (error) {
      isSignUp
        ? setErrorMessage('דוא"ל כבר קיים')
        : setErrorMessage('שם משתמש או סיסמה שגויים');
      setShowError(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, rgba(62, 180, 137, 0.1) 0%, #ffffff 50%, rgba(255, 143, 90, 0.05) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: '1.5rem',
        py: '3rem',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '28rem' }}>
        <Box sx={{ textAlign: 'center', mb: '2rem' }}>
          <Box
            sx={{
              width: '5rem',
              height: '5rem',
              bgcolor: 'primary.main',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: '1rem',
              boxShadow: 3,
            }}
          >
            <AppleIcon
              sx={{ fontSize: '3rem', color: 'primary.contrastText' }}
            />
          </Box>
          <Typography variant="h1" gutterBottom>
            Plan & Plate
          </Typography>
          <Typography color="text.secondary">
            {isSignUp
              ? 'Start your healthy eating journey'
              : 'Welcome back! Ready to eat healthy?'}
          </Typography>
        </Box>

        <Card
          elevation={6}
          sx={{ p: '2rem', borderRadius: '0.75rem', border: 'none' }}
        >
          <CardContent sx={{ p: 0 }}>
            <AuthTabs
              isSignUp={isSignUp}
              setIsSignUp={(value) => {
                setIsSignUp(value);
                setShowError(false);
              }}
            />
            <AuthForm isSignUp={isSignUp} onSubmit={handleSubmit} />
          </CardContent>
        </Card>

        <Collapse in={showError}>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setShowError(false)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{
              mt: 2,
              borderRadius: '0.75rem',
              boxShadow: 2,
              '& .MuiAlert-message': {
                fontWeight: 500,
              },
            }}
          >
            {errorMessage}
          </Alert>
        </Collapse>
      </Box>
    </Box>
  );
}
