import { Box, Typography } from '@mui/material';
import { SurfaceCard } from '@/components/common/SurfaceCard';
import { GroceryItemCard } from '@/features/groceryList/components/GroceryItemCard';
import type { Category, GroceryItem, GroceryItemGroup } from '@/features/groceryList/types/grocery';
import { CATEGORY_EMOJIS } from '@/features/groceryList/utils/categoryEmojis';
import { colors, shadows } from '@/core/theme/tokens';

interface GroceryCategoryGroupProps {
  group: GroceryItemGroup;

  index: number;
  onDelete: (name: string) => void;
  onUpdateInventory: (name: string, quantity: number) => void;
  onToggle: (name: string) => void;
}

export const GroceryCategoryGroup = ({
  group,
  index,
  onDelete,
  onUpdateInventory,
  onToggle,
}: GroceryCategoryGroupProps) => (
  <SurfaceCard
    padding="1.25rem"
    shadow={shadows.card}
    sx={{ animation: 'pp-slideUp .5s both', animationDelay: `${index * 0.06}s` }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5625rem', mb: '0.875rem' }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '0.6875rem',
          bgcolor: colors.mintTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}
      >
        {CATEGORY_EMOJIS[group.category as Category] || '🛒'}
      </Box>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>
        {group.category}
      </Typography>
      <Typography sx={{ ml: 'auto', fontSize: 12, color: colors.textFaint }}>
        {group.items.length} item{group.items.length === 1 ? '' : 's'}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {group.items.map((item: GroceryItem) => (
        <GroceryItemCard
          key={item.name}
          item={item}
          onDelete={onDelete}
          onUpdateInventory={onUpdateInventory}
          onDone={onDelete}
          onToggle={onToggle}
        />
      ))}
    </Box>
  </SurfaceCard>
);
