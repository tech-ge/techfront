import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setDebugInfo('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      setDebugInfo('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } else {
      setError(result.message);
      setDebugInfo('Login failed.try again later');
    }
    
    setLoading(false);
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    setError('');
    setDebugInfo('Attempting admin login...');
    
    const result = await login('admin@example.com', 'Admin@123456');
    
    if (result.success) {
      setDebugInfo('login successful! Redirecting...');
      setTimeout(() => navigate('/admin'), 1000);
    } else {
      setError('login failed: ' + (result.message || 'Unknown error'));
      setDebugInfo('unknown error');
    }
    
    setLoading(false);
  };

  const handleTestDirectLogin = async () => {
    setDebugInfo('Testing direct API call...');
    
    try {
      const response = await fetch('https://techback-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'Admin@123456'
        })
      });
      
      const data = await response.json();
      setDebugInfo(`API Response: ${JSON.stringify(data)}`);
      
      if (data.success) {
        // Save token manually
        localStorage.setItem('token', data.token);
        setDebugInfo('saved to localStorage.Login again.');
      }
    } catch (err) {
      setDebugInfo(`API Error: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Login to TechG
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Exclusive platform for Kenyan science students
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {debugInfo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {debugInfo}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography component="span" color="primary" sx={{ fontWeight: 'bold' }}>
                    Register here
                  </Typography>
                </Link>
              </Typography>
            </Box>

            {/* Test Login Buttons */}
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Quick Test Logins
              </Typography>
              
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
