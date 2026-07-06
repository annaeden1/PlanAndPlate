import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Collapse,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { AuthTabs } from "@/features/auth/components/AuthTabs";
import { userManagementApi } from "@/features/auth/api/auth";
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';

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
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showError, setShowError] = useState(false);

  const isDuplicateEmailError =
    isSignUp && showError && errorMessage === "Email already exists";
  const isPasswordLengthError =
    isSignUp &&
    showError &&
    errorMessage === "Password must be at least 6 characters long";

  const handleSubmit = async (e: React.FormEvent, formData: AuthFormData) => {
    e.preventDefault();
    setShowError(false);
    setErrorMessage("");

    if (isSignUp && formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      setShowError(true);
      return;
    }

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
        setErrorMessage("Email or password is incorrect");
        setShowError(true);
      }
    } catch {
      setErrorMessage(
        isSignUp ? "Email already exists" : "Email or password is incorrect",
      );
      setShowError(true);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    setShowError(false);
    setErrorMessage('');

    if (!credentialResponse.credential) {
      setErrorMessage('Google sign-in was cancelled or failed.');
      setShowError(true);
      return;
    }

    try {
      const response = await userManagementApi.googleSignin(
        credentialResponse.credential,
      );

      if (response.tokens) {
        onAuthComplete(
          {
            accessToken: response.tokens.token,
            refreshToken: response.tokens.refreshToken,
          },
          response.isNewUser ?? false,
        );
      } else {
        setErrorMessage('Google sign-in failed. Please try again.');
        setShowError(true);
      }
    } catch {
      setErrorMessage('Google sign-in failed. Please try again.');
      setShowError(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(62, 180, 137, 0.1) 0%, #ffffff 50%, rgba(255, 143, 90, 0.05) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: "1.5rem",
        py: "3rem",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "28rem" }}>
        <Box sx={{ textAlign: "center", mb: "2rem" }}>
          <Box
            sx={{
              width: "5rem",
              height: "5rem",
              bgcolor: "primary.main",
              borderRadius: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: "1rem",
              boxShadow: 3,
            }}
          >
            <span
              style={{
                fontSize: "2.6rem",
                filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.35)) brightness(1.15)",
                lineHeight: 1,
              }}
            >
              🍃
            </span>
          </Box>
          <Typography variant="h1" gutterBottom>
            Plan & Plate
          </Typography>
          <Typography color="text.secondary">
            {isSignUp
              ? "Start your healthy eating journey"
              : "Welcome back! Ready to eat healthy?"}
          </Typography>
        </Box>

        <Card
          elevation={6}
          sx={{ p: "2rem", borderRadius: "0.75rem", border: "none" }}
        >
          <CardContent sx={{ p: 0 }}>
            <AuthTabs
              isSignUp={isSignUp}
              setIsSignUp={(value: boolean) => {
                setIsSignUp(value);
                setShowError(false);
                setErrorMessage("");
              }}
            />

            <Collapse
              in={showError && !isDuplicateEmailError && !isPasswordLengthError}
            >
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
                  mb: 2,
                  borderRadius: "0.75rem",
                  boxShadow: 2,
                  "& .MuiAlert-message": {
                    fontWeight: 500,
                  },
                }}
              >
                {errorMessage}
              </Alert>
            </Collapse>

            <AuthForm
              isSignUp={isSignUp}
              onSubmit={handleSubmit}
              emailError={isDuplicateEmailError}
              emailHelperText={isDuplicateEmailError ? errorMessage : ""}
              passwordError={isPasswordLengthError}
              passwordHelperText={isPasswordLengthError ? errorMessage : ''}
              googleLoginButton={
                <Box
                  sx={{
                    '& > div': {
                      display: 'flex',
                      justifyContent: 'center',
                    },
                  }}
                >
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setErrorMessage(
                        'Google sign-in failed. Please try again.',
                      );
                      setShowError(true);
                    }}
                    text="continue_with"
                    width="100%"
                    theme="outline"
                    size="large"
                  />
                </Box>
              }
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
