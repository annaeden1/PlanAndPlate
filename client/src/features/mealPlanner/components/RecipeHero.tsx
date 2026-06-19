import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import type { ReactNode } from 'react';
import type { ApiRecipe } from '@/features/mealPlanner/types/mealPlanner';
import platePicturePlaceholder from '@/assets/plate pic.jpg';
import { colors, fonts, shadows } from '@/core/theme/tokens';

interface RecipeHeroProps {
  recipe: ApiRecipe;
  onBack: () => void;
  onToggleLike: () => void;
}

const cornerButtonSx = {
  position: 'absolute' as const,
  bgcolor: 'rgba(255,255,255,.92)',
  backdropFilter: 'blur(4px)',
  boxShadow: '0 0.25rem 0.75rem -0.375rem rgba(0,0,0,.4)',
  '&:hover': { bgcolor: '#fff' },
};

const MetaItem = ({ icon, label }: { icon: ReactNode; label: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,.88)' }}>
    {icon}
    <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'inherit' }}>{label}</Typography>
  </Box>
);

export const RecipeHero = ({ recipe, onBack, onToggleLike }: RecipeHeroProps) => (
  <Box
    sx={{
      position: 'relative',
      height: { xs: '20rem', md: '24rem' },
      borderRadius: '1.625rem',
      overflow: 'hidden',
      boxShadow: shadows.hero,
    }}
  >
    <Box
      component="img"
      src={recipe.image || platePicturePlaceholder}
      alt={recipe.name}
      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(to top, rgba(11,63,46,.95) 0%, rgba(12,71,51,.6) 45%, rgba(12,71,51,.05) 100%)',
      }}
    />

    <IconButton onClick={onBack} aria-label="Go back" sx={{ ...cornerButtonSx, top: '1rem', left: '1rem', color: colors.ink }}>
      <ArrowBackRoundedIcon />
    </IconButton>

    <IconButton
      onClick={onToggleLike}
      aria-label={recipe.isLiked ? 'Remove from liked' : 'Add to liked'}
      sx={{ ...cornerButtonSx, top: '1rem', right: '1rem' }}
    >
      {recipe.isLiked ? <FavoriteIcon sx={{ color: colors.danger }} /> : <FavoriteBorderIcon sx={{ color: colors.ink }} />}
    </IconButton>

    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: { xs: '1.5rem', md: '2rem 2.25rem' } }}>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: colors.greenDeepest,
          bgcolor: colors.mintSoft,
          px: '12px',
          py: '4px',
          borderRadius: '9px',
          mb: '12px',
          textTransform: 'capitalize',
        }}
      >
        {recipe.diets?.[0] || 'Recipe'}
      </Box>
      <Typography
        sx={{
          fontFamily: fonts.display,
          fontWeight: 700,
          color: '#fff',
          fontSize: { xs: '1.9rem', md: '2.75rem' },
          lineHeight: 1.06,
          maxWidth: '52rem',
          mb: '0.85rem',
        }}
      >
        {recipe.name}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <MetaItem icon={<AccessTimeRoundedIcon sx={{ fontSize: '1.2rem' }} />} label={`${recipe.readyInMinutes} mins`} />
        <MetaItem icon={<GroupRoundedIcon sx={{ fontSize: '1.2rem' }} />} label={`${recipe.servings} servings`} />
        <MetaItem
          icon={<LocalFireDepartmentRoundedIcon sx={{ fontSize: '1.2rem' }} />}
          label={`${Math.round(recipe.calories || 0)} cal`}
        />
      </Box>
    </Box>
  </Box>
);
