import { Box, Chip, Typography } from "@mui/material";

export function MissingItemsList({ names }: { names: string[] }) {
  if (names.length === 0) return null;

  return (
    <Box sx={{ mt: "0.75rem" }}>
      <Typography variant="body2" color="text.secondary">
        Not found here ({names.length}):
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", mt: "0.35rem" }}>
        {names.map((name) => (
          <Chip
            key={name}
            size="small"
            variant="outlined"
            label={name}
            sx={{ opacity: 0.7 }}
          />
        ))}
      </Box>
    </Box>
  );
}
