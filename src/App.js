import React from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box
} from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import your pages
import Dashboard from './pages/Dashboard';
import SurveyForm from './pages/SurveyForm';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

const theme = createTheme({
  palette: {
    primary: { main: '#B22222' },
    secondary: { main: '#d32f2f' },
    background: { default: '#f4f6f8' },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Public Survey Route */}
        {/* Public Survey Route (Landing Page) */}
        <Route path="/" element={
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <SurveyForm />
            </Box>
          </Box>
        } />

        {/* Alias /survey to / */}
        <Route path="/survey" element={<Navigate to="/" replace />} />

        {/* Protected Dashboard Route */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <Box component="main" sx={{ flexGrow: 1 }}>
                <Dashboard />
              </Box>
            </Box>
          } />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
