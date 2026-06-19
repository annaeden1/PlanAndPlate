import { Box, Paper } from '@mui/material';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import type { ReactNode } from 'react';
import { colors } from '@/core/theme/tokens';

interface SearchMeal {
  id: string;
  name: string;
}
interface SearchItem {
  name: string;
}

interface SearchDropdownProps {
  hasResults: boolean;
  matchedMeals: SearchMeal[];
  matchedItems: SearchItem[];
  onSelectMeal: () => void;
  onSelectItem: () => void;
}

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Box sx={{ px: '0.875rem', pt: '0.625rem', pb: '0.25rem', fontSize: 11, fontWeight: 700, color: colors.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
    {children}
  </Box>
);

const ResultRow = ({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      px: '0.875rem',
      py: '0.5625rem',
      cursor: 'pointer',
      fontSize: 13,
      color: colors.ink,
      '&:hover': { bgcolor: colors.canvas },
    }}
  >
    {icon}
    {label}
  </Box>
);

export const SearchDropdown = ({
  hasResults,
  matchedMeals,
  matchedItems,
  onSelectMeal,
  onSelectItem,
}: SearchDropdownProps) => (
  <Paper
    elevation={0}
    sx={{
      position: 'absolute',
      top: 'calc(100% + 0.5rem)',
      left: 0,
      right: 0,
      borderRadius: '0.8125rem',
      border: `1px solid ${colors.cardBorder}`,
      boxShadow: '0 0.5rem 1.75rem -0.5rem rgba(20,40,30,.18)',
      overflow: 'hidden',
      zIndex: 1300,
    }}
  >
    {!hasResults ? (
      <Box sx={{ px: '1rem', py: '0.75rem', fontSize: 13, color: colors.textMuted }}>No results found</Box>
    ) : (
      <>
        {matchedMeals.length > 0 && (
          <Box>
            <SectionLabel>Meals</SectionLabel>
            {matchedMeals.map((meal) => (
              <ResultRow
                key={meal.id}
                onClick={onSelectMeal}
                icon={<RestaurantRoundedIcon sx={{ fontSize: 15, color: colors.textFaint }} />}
                label={meal.name}
              />
            ))}
          </Box>
        )}
        {matchedItems.length > 0 && (
          <Box>
            <SectionLabel>Grocery</SectionLabel>
            {matchedItems.map((item) => (
              <ResultRow
                key={item.name}
                onClick={onSelectItem}
                icon={<ShoppingCartRoundedIcon sx={{ fontSize: 15, color: colors.textFaint }} />}
                label={item.name}
              />
            ))}
          </Box>
        )}
      </>
    )}
  </Paper>
);
