import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Container,
    InputAdornment,
    IconButton,
    Fade,
    useTheme
} from '@mui/material';
import {
    Login as LoginIcon,
    Visibility,
    VisibilityOff,
    Lock,
    Person,
    ArrowBack
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';

const MySwal = withReactContent(Swal);
const primaryRed = "#B22222";

// --- Modern Glassmorphism Styles (Brand: Red & White) ---
const styles = {
    background: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Clean Light Gray/White Gradient
        position: 'relative',
        overflow: 'hidden'
    },
    glassCard: {
        p: 6,
        borderRadius: 4,
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.8)', // White Frosted
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 8px 32px 0 rgba(178, 34, 34, 0.15)' // Red-tinted shadow
    },
    inputField: {
        '& .MuiOutlinedInput-root': {
            bgcolor: 'rgba(255, 255, 255, 0.5)',
            color: '#333', // Dark text for light bg
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.1)',
            },
            '&:hover fieldset': {
                borderColor: '#B22222', // Red Hover
            },
            '&.Mui-focused fieldset': {
                borderColor: '#B22222', // Red Focus
                borderWidth: '2px'
            },
            '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.8)'
            }
        },
        '& .MuiInputLabel-root': {
            color: '#666',
            '&.Mui-focused': {
                color: '#B22222'
            }
        },
        '& .MuiInputAdornment-root svg': {
            color: '#B22222' // Red Icons
        }
    },
    actionButton: {
        bgcolor: '#B22222', // Primary Red
        color: '#fff',
        py: 1.8,
        fontSize: '1rem',
        fontWeight: '800',
        borderRadius: 2,
        mt: 2,
        textTransform: 'none',
        boxShadow: '0 4px 15px rgba(178, 34, 34, 0.3)',
        '&:hover': {
            bgcolor: '#8B0000', // Darker Red
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(178, 34, 34, 0.5)'
        },
        transition: 'all 0.3s ease'
    }
};

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/v1/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Login Success
                localStorage.setItem('accessToken', data.access);
                localStorage.setItem('refreshToken', data.refresh);

                Toast.fire({
                    icon: 'success',
                    title: 'Karibu, Umeingia!'
                });

                navigate('/dashboard');
            } else {
                // Login Failed
                throw new Error(data.detail || 'Imeshindikana. Tafadhali hakiki taarifa zako.');
            }
        } catch (error) {
            MySwal.fire({
                icon: 'error',
                title: 'Oups! Imeshindikana',
                text: 'Jina au Nenosiri sio sahihi. Tafadhali jaribu tena.',
                confirmButtonColor: primaryRed,
                background: '#fff',
                iconColor: primaryRed
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={styles.background}>
            {/* Background Orbs for aesthetics */}
            <Box sx={{
                position: 'absolute',
                top: '10%',
                left: '15%',
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(77,182,172,0.4) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(40px)',
                zIndex: 0
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: '10%',
                right: '10%',
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(178,34,34,0.3) 0%, rgba(0,0,0,0) 70%)', // Subtle hint of brand Red
                filter: 'blur(60px)',
                zIndex: 0
            }} />

            <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
                <Fade in timeout={1000}>
                    <Paper elevation={0} sx={styles.glassCard}>
                        {/* Logo / Header */}
                        <Box sx={{ mb: 4, cursor: 'pointer' }} onClick={() => navigate('/')}>
                            <img
                                src="/orci.ico"
                                alt="ORCI Logo"
                                style={{ height: 60, marginBottom: 15, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                            />
                            <Typography variant="h4" sx={{ fontWeight: 800, color: primaryRed, letterSpacing: 1 }}>
                                Login Portal
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, letterSpacing: 0.5 }}>
                                Dodoso & Ripoti Management
                            </Typography>
                        </Box>

                        <form onSubmit={handleLogin}>
                            <TextField
                                fullWidth
                                label="Username (AD)"
                                variant="outlined"
                                margin="normal"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. william.haule"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={styles.inputField}
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                margin="normal"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                sx={{ color: 'rgba(255,255,255,0.7)' }}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ ...styles.inputField, mb: 3 }}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                type="submit"
                                disabled={loading}
                                startIcon={!loading && <LoginIcon />}
                                sx={styles.actionButton}
                            >
                                {loading ? 'Inahakiki...' : 'Ingia (Login)'}
                            </Button>

                            <Box sx={{ mt: 4 }}>
                                <Button
                                    startIcon={<ArrowBack />}
                                    size="small"
                                    onClick={() => navigate('/')}
                                    sx={{
                                        textTransform: 'none',
                                        color: 'text.secondary',
                                        '&:hover': { color: primaryRed, bgcolor: 'transparent' }
                                    }}
                                >
                                    Rudi kwenye Dodoso
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
}

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});
