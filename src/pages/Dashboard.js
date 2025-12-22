import React from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box,
  Button,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatIcon from '@mui/icons-material/Chat';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const features = [
    {
      title: 'Group Chat',
      description: 'Join real-time discussions with fellow scientists',
      icon: <ChatIcon fontSize="large" />,
      action: () => navigate('/chat'),
      color: '#2196f3'
    },
    {
      title: 'Tech Blogs',
      description: 'Read and write technical articles',
      icon: <ArticleIcon fontSize="large" />,
      action: () => navigate('/blogs'),
      color: '#4caf50'
    },
    {
      title: 'Community',
      description: 'Connect with other students',
      icon: <PeopleIcon fontSize="large" />,
      action: () => navigate('/blogs'),
      color: '#ff9800'
    },
    {
      title: 'Profile',
      description: 'Manage your account settings',
      icon: <PersonIcon fontSize="large" />,
      action: () => navigate('/profile'),
      color: '#47b027ff'
    }
  ];

  if (!user) {
    return (
      <Container>
        <Typography>Please login to view dashboard</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name || 'User'}!
        </Typography>
        <Typography variant="body1">
          {user?.course || 'Student'} at {user?.university || 'University'} in {user?.location || 'Location'}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/chat')}
            sx={{ backgroundColor: 'white', color: '#764ba2' }}
          >
            Go to Chat
          </Button>
          <Button 
            variant="outlined" 
            onClick={logout}
            sx={{ borderColor: 'white', color: 'white' }}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Status</Typography>
            <Typography variant="h4" color={user?.status === 'active' ? 'success.main' : 'warning.main'}>
              {user?.status === 'active' ? 'Active' : 'Pending'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Role</Typography>
            <Typography variant="h4" color="primary.main">
              {user?.role || 'user'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">University</Typography>
            <Typography variant="h5">{user?.university || 'Not set'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Course</Typography>
            <Typography variant="h5">{user?.course || 'Not set'}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Features Grid */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  cursor: 'pointer'
                }
              }}
              onClick={feature.action}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: feature.color, mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={feature.action}>Open</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity (Placeholder) */}
      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your recent activity will appear here. Start by joining a chat or writing a blog!
        </Typography>
      </Paper>
    </Container>
  );
};

export default Dashboard;
