import React from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Box,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScienceIcon from '@mui/icons-material/Science';
import ChatIcon from '@mui/icons-material/Chat';
import ArticleIcon from '@mui/icons-material/Article';
import GroupIcon from '@mui/icons-material/Group';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <ChatIcon fontSize="large" color="primary" />,
      title: 'Real-time Chat',
      description: 'Exchange ideas with fellow Kenyan scientists using text, voice notes, and videos.'
    },
    {
      icon: <ArticleIcon fontSize="large" color="primary" />,
      title: 'Tech Blogs',
      description: 'Write and read blogs about latest technologies, research, and innovations.'
    },
    {
      icon: <GroupIcon fontSize="large" color="primary" />,
      title: 'Community',
      description: 'Connect with computer science and cybersecurity students across Kenya.'
    },
    {
      icon: <ScienceIcon fontSize="large" color="primary" />,
      title: 'Science Focused',
      description: 'Exclusive platform for science-related course students in Kenyan universities.'
    }
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          py: 8,
          background: 'linear-gradient(135deg, #79cc58a8 0%, #9ca24bff 100%)',
          borderRadius: 2,
          color: 'white',
          mb: 6
        }}
      >
        <Typography variant="h1" component="h1" sx={{ fontSize: '3.5rem', color: 'green', fontWeight: 'bold', mb: 2 }}>
          TechG
        </Typography>
        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
          Kenyan Science Students Collaboration Platform
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, maxWidth: '800px', margin: '0 auto' }}>
          Connect, collaborate, and exchange ideas with fellow computer science, cybersecurity, 
          and technology students across Kenyan universities.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {user ? (
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{ 
                backgroundColor: 'white', 
                color: '#f80808ff',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate('/login')}
                sx={{ 
                  backgroundColor: 'white', 
                  color: '#764ba2',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              Login
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => navigate('/register')}
              sx={{ 
                borderColor: 'white', 
                color: 'white',
                '&:hover': { borderColor: '#f5f5f5', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Register
            </Button>
          </>
          )}
          <Button 
            variant="outlined" 
            size="large"
            onClick={() => navigate('/blogs')}
            sx={{ 
              borderColor: 'white', 
              color: 'white',
              '&:hover': { borderColor: '#f5f5f5', backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            View Blogs
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Typography variant="h3" component="h2" sx={{ textAlign: 'center', mb: 4 }}>
        Platform Features
      </Typography>
      
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} lg={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Call to Action */}
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h3" gutterBottom>
          Ready to Collaborate?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Join hundreds of Kenyan science students sharing knowledge and building the future together.
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate(user ? '/dashboard' : '/register')}
          sx={{ px: 4 }}
        >
          {user ? 'Go to Dashboard' : 'Get Started Now'}
        </Button>
      </Paper>
    </Container>
  );
};

export default HomePage;
