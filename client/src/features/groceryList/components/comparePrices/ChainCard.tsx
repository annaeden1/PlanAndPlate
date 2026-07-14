import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import type { ChainComparison, ChainId } from "../../types/priceComparison";
import { shekel } from "../../utils/priceFormat";
import { ComparedItemRow } from "./ComparedItemRow";
import { MissingItemsList } from "./MissingItemsList";

const CHAIN_EMOJI: Record<ChainId, string> = {
  "rami-levy": "🟡",
  shufersal: "🔴",
  yohananof: "🟢",
  "osher-ad": "🔵",
};

export function ChainCard({
  chain,
  isCheapest,
}: {
  chain: ChainComparison;
  isCheapest: boolean;
}) {
  return (
    <Box
      sx={{
        borderRadius: "1rem",
        border: "2px solid",
        borderColor: isCheapest ? "success.main" : "divider",
        bgcolor: "background.paper",
        p: "1rem",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Typography component="span" sx={{ fontSize: "1.5rem" }}>
            {CHAIN_EMOJI[chain.chain]}
          </Typography>
          <Typography variant="h6" fontWeight="bold" dir="rtl">
            {chain.displayName}
          </Typography>
          {isCheapest && (
            <Chip
              color="success"
              icon={<EmojiEventsIcon />}
              label="Cheapest"
              sx={{ fontWeight: "bold" }}
            />
          )}
        </Box>
        <Typography variant="h6" fontWeight="bold" color="primary">
          {shekel(chain.total)}
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing="0.5rem"
        alignItems="center"
        sx={{ mt: "0.25rem", color: "text.secondary" }}
      >
        <Typography variant="body2">Items {shekel(chain.subtotal)}</Typography>
        <Typography variant="body2">·</Typography>
        <LocalShippingIcon sx={{ fontSize: "1rem" }} />
        <Typography variant="body2">
          {chain.estimatedDelivery > 0
            ? shekel(chain.estimatedDelivery)
            : chain.deliveryNote ?? "No delivery"}
        </Typography>
      </Stack>

      <Divider sx={{ my: "0.75rem" }} />

      <Stack spacing="0.6rem">
        {chain.items.map((item) => (
          <ComparedItemRow key={`${item.itemName}-${item.code}`} item={item} />
        ))}
      </Stack>

      <MissingItemsList names={chain.missing} />
    </Box>
  );
}
