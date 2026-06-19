import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { SurfaceCard } from '@/components/common/SurfaceCard';
import { colors } from '@/core/theme/tokens';

type ChipTone = 'solid' | 'green' | 'amber';

const CHIP_STYLES: Record<ChipTone, object> = {
  solid: { color: '#fff', background: 'linear-gradient(135deg,#2fbf87,#15674c)', border: 'none' },
  green: { color: colors.greenLeaf, bgcolor: colors.mintTint, border: '1.5px solid rgba(47,191,135,.3)' },
  amber: { color: colors.amber, bgcolor: colors.orangeTintWarm, border: '1.5px solid rgba(240,160,67,.25)' },
};

const Chips = ({ items, empty, tone = 'green' }: { items: string[]; empty: string; tone?: ChipTone }) => {
  const list = items.length ? items : [empty];
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {list.map((label, i) => (
        <Box
          key={`${label}-${i}`}
          component="span"
          sx={{ fontSize: 13, fontWeight: 600, px: '0.875rem', py: '0.375rem', borderRadius: '0.625rem', ...CHIP_STYLES[items.length ? tone : 'green'] }}
        >
          {label}
        </Box>
      ))}
    </Box>
  );
};

const PrefSection = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box sx={{ mb: '1rem' }}>
    <Typography
      sx={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '.06em', mb: '0.625rem' }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

interface DietaryPreferencesCardProps {
  preferences: string[];
  allergyLabels: string[];
  goalChips: string[];
  budget: string;
  onEdit: () => void;
}

export const DietaryPreferencesCard = ({
  preferences,
  allergyLabels,
  goalChips,
  budget,
  onEdit,
}: DietaryPreferencesCardProps) => (
  <SurfaceCard shadow="0 0.5rem 1.375rem -1rem rgba(20,40,30,.35)">
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '1.125rem' }}>
      <Typography variant="h4" sx={{ color: colors.ink }}>
        Dietary preferences
      </Typography>
      <Box
        onClick={onEdit}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3125rem',
          fontSize: 12.5,
          fontWeight: 700,
          color: colors.greenLeaf,
          cursor: 'pointer',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        <EditRoundedIcon sx={{ fontSize: 15 }} /> Edit
      </Box>
    </Box>
    <PrefSection label="Diet">
      <Chips items={preferences} empty="Not set" tone="solid" />
    </PrefSection>
    <PrefSection label="Allergies">
      <Chips items={allergyLabels} empty="None" tone="amber" />
    </PrefSection>
    <PrefSection label="Goals">
      <Chips items={goalChips} empty="Not set" tone="green" />
    </PrefSection>
    <Box sx={{ mt: '0.25rem' }}>
      <Typography
        sx={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '.06em', mb: '0.375rem' }}
      >
        Weekly budget
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>{budget}</Typography>
    </Box>
  </SurfaceCard>
);
