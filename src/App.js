import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import BlogPage from './pages/BlogPage';
import ChatPageNew from './pages/ChatPageNew';
import UsersBrowsePage from './pages/UsersBrowsePage';
import ProfilePage from './pages/ProfilePage';

// Layout
import MainLayout from './layouts/MainLayout';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#44d219ff',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/blogs" element={<MainLayout><BlogPage /></MainLayout>} />
            <Route path="/blogs/:id" element={<MainLayout><BlogPage /></MainLayout>} />
            
            {/* Protected user routes */}
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
            <Route path="/chat" element={<MainLayout><ChatPageNew /></MainLayout>} />
            <Route path="/users" element={<MainLayout><UsersBrowsePage /></MainLayout>} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
