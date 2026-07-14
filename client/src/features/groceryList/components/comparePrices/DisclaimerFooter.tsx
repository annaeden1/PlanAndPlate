import { Alert, Typography } from "@mui/material";

export function DisclaimerFooter({
  disclaimer,
  pricesAsOf,
}: {
  disclaimer: string;
  pricesAsOf: string;
}) {
  return (
    <Alert severity="info" icon={false} sx={{ mt: "1.5rem" }}>
      <Typography variant="body2" dir="rtl" sx={{ display: "block" }}>
        {disclaimer}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: "0.5rem" }}
      >
        Prices as of {new Date(pricesAsOf).toLocaleString("he-IL")}
      </Typography>
    </Alert>
  );
}
