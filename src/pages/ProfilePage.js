import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    age: user?.age || '',
    location: user?.location || '',
    phone: user?.phone || '',
    university: user?.university || '',
    course: user?.course || '',
    about: user?.about || '',
    profilePhoto: user?.profilePhoto || null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        if (aspectRatio < 0.9 || aspectRatio > 1.1) {
          setError(`Profile photo must be square (1:1). Current ratio: ${aspectRatio.toFixed(2)}:1`);
          return;
        }

        const base64 = event.target.result;
        setFormData(prev => ({
          ...prev,
          profilePhoto: base64
        }));
        setError('');
        setSuccess('Photo selected — click Save to upload');
        setTimeout(() => setSuccess(''), 3000);
      };
      img.onerror = () => setError('Invalid image');
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        setError('Age must be between 18 and 100');
        setLoading(false);
        return;
      }

      // FIXED: Using correct endpoint /api/users/profile
      const response = await api.put('/users/profile', {
        name: formData.name,
        age: ageNum,
        location: formData.location,
        phone: formData.phone,
        about: formData.about,
        profilePhoto: formData.profilePhoto
      });

      if (response.data.success) {
        setUser(response.data.user);
        setSuccess('Profile updated successfully! Photo saved.');
        setEditing(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      age: user?.age || '',
      location: user?.location || '',
      phone: user?.phone || '',
      university: user?.university || '',
      course: user?.course || '',
      about: user?.about || '',
      profilePhoto: user?.profilePhoto || null
    });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Please login to view your profile</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          My Profile
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Grid container spacing={3}>
          {/* Profile Photo */}
          <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                sx={{
                  width: 150,
                  height: 150,
                  fontSize: '3rem',
                  bgcolor: 'primary.main'
                }}
                src={formData.profilePhoto || undefined}
              >
                {formData.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>

              {editing && (
                <Button
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: '50%',
                    minWidth: '44px',
                    height: '44px',
                    p: 0,
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  <CameraAltIcon />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </Button>
              )}
            </Box>

            {editing && formData.profilePhoto && !formData.profilePhoto.startsWith('http') && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'success.main' }}>
                ✓ New photo ready to save
              </Typography>
            )}
          </Grid>

          {/* Profile Form */}
          <Grid item xs={12} sm={8}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Account Information
                </Typography>
                {!editing ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditing(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  variant={editing ? 'outlined' : 'standard'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email}
                  disabled
                  variant="standard"
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  disabled={!editing}
                  variant={editing ? 'outlined' : 'standard'}
                  inputProps={{ min: 18, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  variant={editing ? 'outlined' : 'standard'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={!editing}
                  variant={editing ? 'outlined' : 'standard'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="University"
                  value={formData.university}
                  disabled
                  variant="standard"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Course"
                  value={formData.course}
                  disabled
                  variant="standard"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="About"
                  name="about"
                  multiline
                  rows={4}
                  value={formData.about}
                  onChange={handleChange}
                  disabled={!editing}
                  variant={editing ? 'outlined' : 'standard'}
                  helperText={`${formData.about.length}/5000 characters`}
                  inputProps={{ maxLength: 5000 }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Account Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>Status</Typography>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {user?.status || 'Unknown'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>Role</Typography>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {user?.role || 'User'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>Member Since</Typography>
                <Typography variant="body2">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>User ID</Typography>
                <Typography variant="caption">{user?._id || 'N/A'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
