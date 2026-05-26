import { useGroceryList } from "@/context/GroceryListContext";
import { AddItemDialog } from "@/features/groceryList/components/AddItemDialog";
import { GroceryItemCard } from "@/features/groceryList/components/GroceryItemCard";
import type {
  Category,
  GroceryItem,
  GroceryItemGroup,
} from "@/features/groceryList/types/grocery";
import { CATEGORY_EMOJIS } from "@/features/groceryList/utils/categoryEmojis";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fab,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useMemo, useState } from "react";
import { ProgressCard } from "../components/common/ProgressCard";
import { PageHeader } from "@/components/common/PageHeader";

export const GroceryList = () => {
  const {
    groups,
    loading,
    error,
    removeItem,
    addItem,
    updateInventoryQuantity,
    removeBoughtItems,
    toggleChecked,
  } = useGroceryList();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map((g: GroceryItemGroup) => ({
        ...g,
        items: g.items.filter((item: GroceryItem) =>
          item.name.toLowerCase().includes(q),
        ),
      }))
      .filter((g: GroceryItemGroup) => g.items.length > 0);
  }, [groups, searchQuery]);

  const { totalItems, inStockItems, itemsToBuy, percentage, hasInStockItems } =
    useMemo(() => {
      const allItems = groups.flatMap((g) => g.items);
      const total = allItems.length;
      const inStock = allItems.filter(
        (item) => item.inventoryQuantity >= item.quantity,
      ).length;
      return {
        totalItems: total,
        inStockItems: inStock,
        itemsToBuy: total - inStock,
        percentage: total === 0 ? 0 : (inStock / total) * 100,
        hasInStockItems: allItems.some(
          (item) => item.inventoryQuantity >= item.quantity || item.checked,
        ),
      };
    }, [groups]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        mx: "auto",
        pb: hasInStockItems ? "6rem" : "3rem",
      }}
    >
      <PageHeader title="Grocery List" subtitle="Smart shopping made easy" />
      <Box
        sx={{
          maxWidth: "80rem",
          mx: "auto",
          px: { xs: "1rem", sm: "1.5rem" },
          py: "1.5rem",
          mt: "-2rem",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "350px 1fr" },
          gap: "2rem",
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            minWidth: 0,
          }}
        >
          <ProgressCard
            title="Shopping Progress"
            primaryText={`${inStockItems} of ${totalItems} items in stock`}
            chipLabel={`${itemsToBuy} to buy`}
            progressValue={percentage}
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "1rem",
                  backgroundColor: "background.paper",
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{
                borderStyle: "dashed",
                borderWidth: 2,
                borderRadius: "1rem",
                py: "0.75rem",
                color: "text.primary",
                borderColor: "divider",
                "&:hover": {
                  borderStyle: "dashed",
                  borderWidth: 2,
                  borderColor: "primary.main",
                  bgcolor: "transparent",
                },
              }}
            >
              Add Item
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            minWidth: 0,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: "1.5rem" }}>
              {error}
            </Alert>
          )}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: "3rem" }}>
              <CircularProgress color="primary" />
            </Box>
          ) : filteredGroups.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ py: "2rem" }}
            >
              No items found.
            </Typography>
          ) : (
            <Stack spacing="1.5rem">
              {filteredGroups.map((group) => (
                <Box key={group.category}>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                      mb: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {CATEGORY_EMOJIS[group.category as Category] || "🛒"}{" "}
                    {group.category}
                  </Typography>
                  <Stack spacing="0.75rem">
                    {group.items.map((item: GroceryItem) => (
                      <GroceryItemCard
                        key={item.name}
                        item={item}
                        onDelete={removeItem}
                        onUpdateInventory={updateInventoryQuantity}
                        onDone={removeItem} // same action as delete; both remove from DB
                        onToggle={toggleChecked}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      <AddItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={addItem}
      />

      {/* FAB operates on the full list, not just filtered view — intentional */}
      {hasInStockItems && (
        <Fab
          variant="extended"
          color="primary"
          onClick={removeBoughtItems}
          sx={{
            position: "fixed",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow: 4,
            fontWeight: "bold",
            px: "2rem",
          }}
        >
          <CheckIcon sx={{ mr: 1 }} />
          Finish Shopping
        </Fab>
      )}
    </Box>
  );
};
