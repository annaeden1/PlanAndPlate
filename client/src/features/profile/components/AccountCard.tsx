import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { SurfaceCard } from '@/components/common/SurfaceCard';
import { colors } from '@/core/theme/tokens';

const AccountRow = ({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      p: '0.75rem 0.875rem',
      borderRadius: '0.875rem',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background .2s',
      '&:hover': { background: danger ? colors.orangeTint : '#f6f7f4' },
    }}
  >
    <Box sx={{ width: 26, display: 'flex', justifyContent: 'center', color: danger ? colors.danger : colors.ink }}>
      {icon}
    </Box>
    <Typography sx={{ fontSize: 14, fontWeight: 600, color: danger ? colors.danger : colors.ink, flex: 1 }}>
      {label}
    </Typography>
    <ChevronRightRoundedIcon sx={{ fontSize: 18, color: colors.textGhost }} />
  </Box>
);

interface AccountCardProps {
  onEditProfile: () => void;
  onChangePassword: () => void;
  onSignOut: () => void;
}

export const AccountCard = ({ onEditProfile, onChangePassword, onSignOut }: AccountCardProps) => (
  <SurfaceCard shadow="0 0.5rem 1.375rem -1rem rgba(20,40,30,.35)">
    <Typography variant="h4" sx={{ color: colors.ink, mb: '1rem' }}>
      Account
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
      <AccountRow icon={<EditRoundedIcon sx={{ fontSize: 19 }} />} label="Edit profile" onClick={onEditProfile} />
      <AccountRow icon={<LockRoundedIcon sx={{ fontSize: 19 }} />} label="Change password" onClick={onChangePassword} />
      <AccountRow icon={<NotificationsRoundedIcon sx={{ fontSize: 19 }} />} label="Notifications" />
      <AccountRow icon={<LogoutRoundedIcon sx={{ fontSize: 19 }} />} label="Log out" onClick={onSignOut} danger />
    </Box>
  </SurfaceCard>
);
