import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme, Typography, Box } from "@mui/material";
import { MainLayout } from "./components/layout/MainLayout";

const theme = createTheme({
  palette: {
    primary: {
      main: "#3eb489",
    },
    background: {
      default: "#f9fafb",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
  },
  shape: {
    borderRadius: 10,
  },
});

const Page = ({ title }: { title: string }) => (
  <Box sx={{ pt: 4, textAlign: "center" }}>
    <Typography variant="h4" fontWeight={700}>{title}</Typography>
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/"        element={<Page title="🏠 Home" />} />
            <Route path="/planner" element={<Page title="📅 Planner" />} />
            <Route path="/cart"    element={<Page title="🛒 Cart" />} />
            <Route path="/scanner" element={<Page title="📷 Scanner" />} />
            <Route path="/profile" element={<Page title="👤 Profile" />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
