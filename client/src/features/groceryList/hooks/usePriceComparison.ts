import { useState } from "react";
import { groceryListApi } from "../api/groceryList";
import type { PriceComparisonResult } from "../types/priceComparison";
import { getUserId } from "@/shared/utils/userId";
import { getErrorMessage } from "@/shared/utils/errorMessage";

/** Owns the price-comparison drawer state and the fetch that fills it. */
export function usePriceComparison() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PriceComparisonResult | null>(null);

  const compare = async () => {
    setOpen(true);
    setError(null);

    const userId = getUserId();
    if (!userId) {
      setError("You must be signed in to compare prices.");
      return;
    }

    setLoading(true);
    try {
      setResult(await groceryListApi.getPriceComparison(userId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const close = () => setOpen(false);

  return { open, loading, error, result, compare, close };
}
