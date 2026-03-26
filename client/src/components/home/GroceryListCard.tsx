import { Box, Typography, Button } from "@mui/material";
import { ProgressCard } from "../common/ProgressCard";
import type { GroceryListStatus } from "../../pages/Home/mockData";

interface GroceryListCardProps {
  groceryStatus: GroceryListStatus;
}

export const GroceryListCard = ({ groceryStatus }: GroceryListCardProps) => {
  const { checkedItems, totalItems } = groceryStatus;
  const itemsToBuy = totalItems - checkedItems;
  const percentage = totalItems === 0 ? 0 : (checkedItems / totalItems) * 100;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "0.75rem",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Grocery List
        </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{
            borderRadius: "1.25rem",
            textTransform: "none",
            fontWeight: 600,
            px: "1.25rem",
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          }}
        >
          View List
        </Button>
      </Box>

      <ProgressCard
        title="Shopping Progress"
        primaryText={`${checkedItems} of ${totalItems} items`}
        chipLabel={`${itemsToBuy} to buy`}
        progressValue={percentage}
      />
    </Box>
  );
};
