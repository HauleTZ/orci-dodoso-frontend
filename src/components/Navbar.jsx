import React from "react";
import { AppBar, Toolbar, Box, Typography, Button, IconButton } from "@mui/material";
import { ExpandMore, Logout } from "@mui/icons-material";
import { useNavigate, useLocation } from 'react-router-dom';

const primaryRed = "#B22222";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    return (
        <AppBar position="sticky" sx={{ bgcolor: primaryRed, boxShadow: 3 }}>
            <Toolbar sx={{ px: 4, display: "flex", justifyContent: "space-between" }}>
                {/* Logo and App Name */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <Box
                        component="img"
                        src="/orci.ico"
                        sx={{ height: 40, width: 40, borderRadius: "50%", bgcolor: "white", p: 0.2 }}
                        onError={(e) => {
                            e.target.src = "https://via.placeholder.com/40?text=ORCI";
                        }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1, display: { xs: "none", sm: "block" } }}>
                        ORCI e-Dodoso
                    </Typography>
                </Box>

                {/* Navigation Buttons */}
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                        color="inherit"
                        onClick={() => navigate('/dashboard')}
                        sx={{
                            fontWeight: currentPath === '/dashboard' ? 700 : 500,
                            borderBottom: currentPath === '/dashboard' ? "2px solid white" : "none",
                            borderRadius: 0,
                            px: 2,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
                        }}
                    >
                        Dashboard
                    </Button>
                    <Button
                        color="inherit"
                        onClick={() => navigate('/')}
                        sx={{
                            fontWeight: currentPath === '/' || currentPath === '/survey' ? 700 : 500,
                            borderBottom: (currentPath === '/' || currentPath === '/survey') ? "2px solid white" : "none",
                            borderRadius: 0,
                            px: 2,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
                        }}
                    >
                        Survey Form
                    </Button>
                    {/* Logout Button (Only if token exists) */}
                    {localStorage.getItem('accessToken') && (
                        <Button
                            color="inherit"
                            onClick={handleLogout}
                            startIcon={<Logout />}
                            sx={{
                                fontWeight: 500,
                                px: 2,
                                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
                            }}
                        >
                            Ondoka
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
