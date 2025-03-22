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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { useState } from "react";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import NotificationsIcon from "@mui/icons-material/Notifications";
import TranslateIcon from "@mui/icons-material/Translate";

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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Customize your app preferences
        </Typography>
        <Paper sx={{ p: 2 }}>
          <List>
            <ListItem>
              <ListItemIcon>
                <DarkModeIcon />
              </ListItemIcon>
              <ListItemText primary="Dark Mode" secondary="Enable dark theme" />
              <Switch edge="end" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Notifications"
                secondary="Enable push notifications"
              />
              <Switch edge="end" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TranslateIcon />
              </ListItemIcon>
              <ListItemText
                primary="Language"
                secondary="Choose your preferred language"
              />
              <Switch edge="end" />
            </ListItem>
          </List>
        </Paper>
      </Box>
    </Container>
  );
}
