"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { NotificationService } from "@/services/notificationService";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
];

export default function SettingsPage() {
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null
  );
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    setNotifications(notificationService.isEnabled());
  }, []);

  const handleLanguageChange = (event: any) => {
    setLanguage(event.target.value);
  };

  const handleNotificationsChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const enabled = event.target.checked;
    setNotifications(enabled);

    if (enabled) {
      const granted = await notificationService.requestPermission();
      if (!granted) {
        setNotificationError(
          "Please enable notifications in your browser settings"
        );
        setNotifications(false);
        return;
      }
    }

    notificationService.setEnabled(enabled);
    setNotificationError(null);
  };

  const handleSave = () => {
    console.log("Saving settings:", {
      language,
      notifications,
    });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        <StyledPaper>
          <Typography variant="h6" gutterBottom>
            Language Preferences
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              id="language-select"
              value={language}
              label="Language"
              onChange={handleLanguageChange}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </StyledPaper>

        <StyledPaper>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={notifications}
                  onChange={handleNotificationsChange}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <NotificationsIcon />
                  <Typography>Enable Notifications</Typography>
                </Box>
              }
            />
            {notificationError && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {notificationError}
              </Alert>
            )}
          </FormGroup>
        </StyledPaper>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{ mt: 3 }}
        >
          Save Changes
        </Button>
      </Box>
    </Container>
  );
}
