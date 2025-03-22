import { Box, Container, Typography, Paper } from "@mui/material";
import Map from "@/components/Map";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <main>
      <Navigation />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h1" component="h1" gutterBottom>
            DRTime
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            color="text.secondary"
          >
            Durham Region Transit Real-time Tracking
          </Typography>

          <Paper sx={{ p: 2, mt: 4 }}>
            <Map />
          </Paper>
        </Box>
      </Container>
    </main>
  );
}
