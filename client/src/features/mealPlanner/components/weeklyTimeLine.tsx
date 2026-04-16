import { Box, Button, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface WeeklyTimelineProps {
  currentWeek: number;
  onWeekChange: (week: number) => void;
  selectedDay: string;
  onDaySelect: (day: string) => void;
  days: string[];
  weekRange: string;
}

export function WeeklyTimeline({
  currentWeek,
  onWeekChange,
  selectedDay,
  onDaySelect,
  days,
  weekRange,
}: WeeklyTimelineProps) {
  return (
    <>
      <Box
        sx={{
          px: "1.5rem",
          py: "1rem",
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          position: "sticky",
          top: "4rem",
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            maxWidth: "80rem",
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <IconButton onClick={() => onWeekChange(currentWeek - 1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Week of
            </Typography>
            <Typography>{weekRange}</Typography>
          </Box>
          <IconButton onClick={() => onWeekChange(currentWeek + 1)}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          px: "1.5rem",
          py: "1.5rem",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.default",
          position: "sticky",
          top: "7.5rem",
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            maxWidth: "80rem",
            mx: "auto",
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            overflowX: "auto",
            pb: "0.5rem",
          }}
        >
          {days.map((day) => (
            <Button
              key={day}
              onClick={() => onDaySelect(day)}
              variant={selectedDay === day ? "contained" : "text"}
              sx={{
                borderRadius: "1.5rem",
                px: "1.5rem",
                py: "0.75rem",
                whiteSpace: "nowrap",
                ...(selectedDay !== day && {
                  bgcolor: "grey.100",
                  color: "text.secondary",
                  "&:hover": { bgcolor: "grey.200" },
                }),
              }}
            >
              {day}
            </Button>
          ))}
        </Box>
      </Box>
    </>
  );
}