import { Box, Container, Typography, Paper } from "@mui/material";
import Map from "@/components/Map";

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Durham Region Transit Real-time Information
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Find bus stops, check schedules, and plan your trips in real-time
        </Typography>
        <Paper sx={{ p: 2, height: "60vh" }}>
          <Map />
        </Paper>
      </Box>
    </Container>
  );
}
