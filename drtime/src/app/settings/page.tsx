"use client";

import {
  Container,
  Typography,
  Box,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  Paper,
  TextField,
  Button,
} from "@mui/material";
import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    realTimeUpdates: true,
    showBusSpeed: true,
    showBusCapacity: false,
    darkMode: false,
    language: "ko",
    updateInterval: "30",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = event.target;
    setSettings((prev) => ({
      ...prev,
      [name]: event.target.type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    // TODO: Implement settings save functionality
    console.log("Saving settings:", settings);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Setting
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Real time update
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.realTimeUpdates}
                onChange={handleChange}
                name="realTimeUpdates"
              />
            }
            label=" Real time update "
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.showBusSpeed}
                onChange={handleChange}
                name="showBusSpeed"
              />
            }
            label="Bus Speed"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.showBusCapacity}
                onChange={handleChange}
                name="showBusCapacity"
              />
            }
            label="Crowd"
          />
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Setting
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.darkMode}
                onChange={handleChange}
                name="darkMode"
              />
            }
            label="Dark Mode"
          />
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Etc
        </Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            select
            fullWidth
            label="language"
            name="language"
            value={settings.language}
            onChange={handleChange}
            SelectProps={{
              native: true,
            }}
          >
            <option value="en">English</option>
          </TextField>
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="update "
            name="updateInterval"
            value={settings.updateInterval}
            onChange={handleChange}
            type="number"
          />
        </Box>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
