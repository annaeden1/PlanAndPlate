import { Box, ClickAwayListener, IconButton, InputBase, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { useLocation } from 'react-router-dom';
import { SearchDropdown } from './topbar/SearchDropdown';
import { getRouteMeta, greeting } from '@/config/routeMeta';
import { useCurrentUser } from '@/context/UserContext';
import { useGlobalSearch } from '@/shared/hooks/useGlobalSearch';
import { colors, gradients, shadows } from '@/core/theme/tokens';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  const location = useLocation();
  const meta = getRouteMeta(location.pathname);
  const user = useCurrentUser();
  const search = useGlobalSearch();

  const title = meta.isGreeting
    ? `${greeting()}${user.firstName ? `, ${user.firstName}` : ''}`
    : meta.title;

  return (
    <Box
      sx={{
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
        p: { xs: '1rem 1.125rem 0.875rem', md: '1.5rem 2.125rem 1.125rem' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <IconButton
          onClick={onMenuClick}
          aria-label="Open navigation"
          sx={{ display: { md: 'none' }, color: colors.ink }}
        >
          <MenuRoundedIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" noWrap sx={{ fontSize: { xs: 21, md: 26 }, color: colors.ink, lineHeight: 1.1 }}>
            {title}
          </Typography>
          <Typography noWrap sx={{ fontSize: 13.5, color: colors.textMuted, mt: '0.1875rem' }}>
            {meta.subtitle}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <ClickAwayListener onClickAway={() => search.setOpen(false)}>
          <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'relative', width: 280 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5625rem',
                bgcolor: '#fff',
                borderRadius: '0.8125rem',
                px: '1rem',
                py: '0.5rem',
                boxShadow: '0 0.25rem 0.875rem -0.625rem rgba(20,40,30,.4)',
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <SearchRoundedIcon sx={{ fontSize: 18, color: colors.textFaint }} />
              <InputBase
                value={search.query}
                onChange={search.handleChange}
                onKeyDown={search.handleKeyDown}
                onFocus={() => search.setOpen(true)}
                placeholder="Search recipes, products…"
                sx={{ fontSize: 13, flex: 1, color: colors.ink }}
                inputProps={{ 'aria-label': 'Search recipes and products' }}
              />
            </Box>

            {search.showDropdown && (
              <SearchDropdown
                hasResults={search.hasResults}
                matchedMeals={search.matchedMeals}
                matchedItems={search.matchedItems}
                onSelectMeal={() => search.goTo('/planner')}
                onSelectItem={() => search.goTo('/cart')}
              />
            )}
          </Box>
        </ClickAwayListener>

        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '0.8125rem',
            background: gradients.cta,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            boxShadow: shadows.cta,
            flex: 'none',
          }}
        >
          {user.initial}
        </Box>
      </Box>
    </Box>
  );
};
