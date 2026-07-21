import {
  Alert,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { PriceComparisonResult } from "../types/priceComparison";
import { ChainCard } from "./comparePrices/ChainCard";
import { DisclaimerFooter } from "./comparePrices/DisclaimerFooter";

interface ComparePricesDrawerProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  result: PriceComparisonResult | null;
  onClose: () => void;
}

const cheapestChainId = (result: PriceComparisonResult): string | null => {
  const complete = result.chains.filter(
    (c) => c.items.length > 0 && c.missing.length === 0,
  );
  if (complete.length === 0) return null;
  return complete.reduce((min, c) => (c.total < min.total ? c : min)).chain;
};

export function ComparePricesDrawer({
  open,
  loading,
  error,
  result,
  onClose,
}: ComparePricesDrawerProps) {
  const cheapestId = result ? cheapestChainId(result) : null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: "100vw", sm: 620, md: 720 }, p: "2rem" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: "1rem",
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Compare Prices
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {loading && (
          <Box sx={{ textAlign: "center", py: "3rem" }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: "1rem" }}>
              Checking prices across supermarkets…
            </Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && result && (
          <>
            <Stack spacing="1rem">
              {result.chains.map((chain) => (
                <ChainCard
                  key={chain.chain}
                  chain={chain}
                  isCheapest={chain.chain === cheapestId}
                />
              ))}
            </Stack>

            <DisclaimerFooter
              disclaimer={result.disclaimer}
              pricesAsOf={result.pricesAsOf}
            />
          </>
        )}
      </Box>
    </Drawer>
  );
}
