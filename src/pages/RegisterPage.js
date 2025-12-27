import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
  MenuItem,
  Stepper,
  Step,
  StepLabel, 
  TextareaAutosize
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import LockIcon from '@mui/icons-material/Lock';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const steps = ['Personal Info', 'University Details', 'Profile Setup', 'Account Security'];

const scienceCourses = [
  'Computer Science',
  'Software Engineering',
  'Cybersecurity',
  'Data Science',
  'Information Technology',
  'Computer Engineering',
  'Network Security',
  'Artificial Intelligence',
  'Other Science'
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    username: '',
    email: '',
    phone: '',
    location: '',
    age: '',
    
    // Step 2
    university: '',
    course: '',
    
    // Step 3
    profilePhoto: null,
    about: '',
    
    // Step 4
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check aspect ratio is 1:1 (square)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        if (aspectRatio < 0.9 || aspectRatio > 1.1) {
          setError(`Profile photo must be square (1:1). Current: ${aspectRatio.toFixed(2)}:1`);
          return;
        }

        // Convert to base64
        const base64 = event.target.result;
        setFormData({
          ...formData,
          profilePhoto: base64
        });
        setError('');
      };
      img.onerror = () => {
        setError('Invalid image file');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    // Validate current step
    let isValid = true;
    
    if (activeStep === 0) {
      if (!formData.name || !formData.username || !formData.email || !formData.phone || !formData.location || !formData.age) {
        setError('Please fill all personal information fields');
        isValid = false;
      } else if (parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
        setError('Age must be between 18 and 100');
        isValid = false;
      }
    } else if (activeStep === 1) {
      if (!formData.university || !formData.course) {
        setError('Please fill all university details');
        isValid = false;
      }
    } else if (activeStep === 2) {
      if (!formData.profilePhoto) {
        setError('Please upload a profile photo');
        isValid = false;
      }
    }
    
    if (isValid) {
      setError('');
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const userData = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      location: formData.location,
      phone: formData.phone,
      university: formData.university,
      age: parseInt(formData.age),
      course: formData.course,
      profilePhoto: formData.profilePhoto,
      about: formData.about
    };

    const result = await register(userData);
    
    if (result.success) {
      if (result.data.requiresAdminApproval) {
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Your account is pending admin approval since you selected a non-science course.' 
          } 
        });
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <PersonIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="age"
                label="Age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                inputProps={{ min: 18, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <EmailIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <PhoneIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="location"
                label="Location (City/Town)"
                value={formData.location}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <LocationOnIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="university"
                label="University Name"
                value={formData.university}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <SchoolIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                select
                fullWidth
                name="course"
                label="Course of Study"
                value={formData.course}
                onChange={handleChange}
                helperText="Only science-related courses are automatically approved"
              >
                {scienceCourses.map((course) => (
                  <MenuItem key={course} value={course}>
                    {course}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> Only students from science-related courses (Computer Science, Cybersecurity, etc.) 
                  will be automatically approved. Other courses require admin approval.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>Upload Profile Photo</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Photo must be square (1:1 aspect ratio)
              </Typography>
              
              {formData.profilePhoto ? (
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    aspectRatio: '1/1',
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    overflow: 'hidden',
                    margin: '0 auto',
                    mb: 2
                  }}
                >
                  <Box
                    component="img"
                    src={formData.profilePhoto}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt="Profile preview"
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    border: '2px dashed #999',
                    margin: '0 auto',
                    mb: 2
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 60, color: '#999' }} />
                </Box>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                id="profile-photo-input"
              />
              <label htmlFor="profile-photo-input">
                <Button
                  variant="contained"
                  component="span"
                  sx={{ mb: 3 }}
                >
                  {formData.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                </Button>
              </label>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold', mb: 1 }}>
                About You (Optional)
              </Typography>
              <TextareaAutosize
                minRows={6}
                name="about"
                value={formData.about}
                onChange={handleChange}
                placeholder="Write about yourself, your interests, and why you're joining TechG... (minimum 1000 characters recommended)"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
              />
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                {formData.about.length} characters
              </Typography>
            </Grid>
          </Grid>
        );
      
      case 3:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <LockIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
                helperText="Minimum 6 characters with uppercase, lowercase, and number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <LockIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Important:</strong> Use a strong password. Do not share your credentials.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Join TechG Community
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Register as a Kenyan science student
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={activeStep === steps.length - 1 ? handleSubmit : (e) => e.preventDefault()}>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Complete Registration'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography component="span" color="primary" sx={{ fontWeight: 'bold' }}>
                    Login here
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
