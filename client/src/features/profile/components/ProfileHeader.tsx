import { Avatar, Box, Typography } from '@mui/material';

interface ProfileHeaderProps {
  username: string;
  email: string;
}

export function ProfileHeader({ username, email }: ProfileHeaderProps) {
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: '1rem' }}
    >
      <Avatar
        sx={{
          width: '4rem',
          height: '4rem',
          background: 'linear-gradient(135deg, #3eb489 0%, #ff8f5a 100%)',
          fontSize: '1.5rem',
        }}
      >
        {username.substring(0, 2).toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h3">{username}</Typography>
        <Typography variant="body2" color="text.secondary">
          {email}
        </Typography>
      </Box>
    </Box>
  );
}
