import { Box, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { ComparedItem } from "../../types/priceComparison";
import { shekel } from "../../utils/priceFormat";

export function ComparedItemRow({ item }: { item: ComparedItem }) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body1" fontWeight={600}>
            {item.itemName}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            dir="rtl"
            sx={{ display: "block" }}
          >
            {item.matchedProductName}
          </Typography>
          {item.packagesAssumed > 1 && (
            <Typography
              variant="caption"
              color="text.secondary"
              dir="rtl"
              sx={{ display: "block" }}
            >
              {shekel(item.unitPrice)} × {item.packagesAssumed}
            </Typography>
          )}
        </Box>
        <Typography variant="body1" fontWeight={600} whiteSpace="nowrap">
          {shekel(item.lineTotal)}
        </Typography>
      </Box>

      {item.note && (
        <Box
          sx={{
            display: "flex",
            gap: "0.35rem",
            mt: "0.25rem",
            color: "warning.main",
          }}
        >
          <WarningAmberIcon sx={{ fontSize: "1rem", mt: "0.15rem" }} />
          <Typography variant="body2" dir="rtl">
            {item.note}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
