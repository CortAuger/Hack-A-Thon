/**
 * Navigation Component
 * Provides the main navigation bar for the application.
 * Implements responsive design with different layouts for mobile and desktop views.
 *
 * Features:
 * - Responsive navigation menu
 * - Route-based active state
 * - Icon-based navigation items
 * - Mobile-friendly design
 */

"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SettingsIcon from "@mui/icons-material/Settings";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";

/**
 * Navigation menu configuration
 * Defines the available pages and their properties
 */
const pages = [
  { name: "Search", path: "/search", icon: <SearchIcon /> },
  { name: "Routes", path: "/routes/list", icon: <DirectionsBusIcon /> },
  { name: "Stops", path: "/stops", icon: <LocationOnIcon /> },
  { name: "Weather", path: "/weather", icon: <WbSunnyIcon /> },
  { name: "Settings", path: "/settings", icon: <SettingsIcon /> },
];

/**
 * Navigation Component
 * Main navigation bar that provides access to different sections of the application
 */
export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  /**
   * Handles opening the navigation menu on mobile devices
   */
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  /**
   * Handles opening the user menu (currently unused)
   */
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  /**
   * Handles closing the navigation menu
   */
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  /**
   * Handles closing the user menu
   */
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  /**
   * Handles navigation and page refresh for specific routes
   * @param path - The target path to navigate to
   */
  const handleNavigation = (path: string) => {
    // Pages that use Google Maps API need refresh to prevent loading errors
    const mapsPages = ["/search", "/stops"];

    if (mapsPages.includes(path)) {
      // Force page refresh for Google Maps pages
      window.location.href = path;
    } else {
      // Use regular client-side navigation for other pages
      router.push(path);
    }
    handleCloseNavMenu();
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton> */}

          {/* Logo for desktop view */}
          <DirectionsBusIcon
            sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}
          />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            DRTIME
          </Typography>

          {/* Mobile menu */}
          {/*
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
             <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.name}
                  onClick={() => {
                    handleCloseNavMenu();
                    router.push(page.path);
                  }}
                >
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu> 
          </Box> */}

          {/* Logo for mobile view */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
            }}
          >
            <DirectionsBusIcon sx={{ mr: 1 }} />
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="/"
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              DRTIME
            </Typography>
          </Box>

          {/* Desktop navigation menu */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              justifyContent: "center", // Center the navigation items
            }}
          >
            {pages.map((page) => (
              <Button
                key={page.name}
                onClick={() => handleNavigation(page.path)}
                sx={{
                  my: 2,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mx: 1,
                  backgroundColor:
                    pathname === page.path
                      ? "rgba(255, 255, 255, 0.1)"
                      : "transparent",
                }}
              >
                {page.icon}
                {page.name}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
