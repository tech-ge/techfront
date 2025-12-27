import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextareaAutosize,
  Chip,
  Stack 
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const UsersBrowsePage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name'); // name, course
  const [selectedUser, setSelectedUser] = useState(null);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [editedAbout, setEditedAbout] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load all users - FIXED endpoint
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // FIXED: Using /api/auth/users instead of /auth/users
        const response = await api.get('/auth/users');
        setUsers(response.data.users || response.data.data?.users || []);
        setError('');
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(u => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    if (searchType === 'name') {
      return u.name.toLowerCase().includes(searchLower) || 
             (u.username && u.username.toLowerCase().includes(searchLower));
    } else if (searchType === 'course') {
      return u.course && u.course.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const openUserProfile = (userData) => {
    setSelectedUser(userData);
    setEditedAbout(userData.about || '');
    setOpenProfileModal(true);
  };

  const closeProfileModal = () => {
    setOpenProfileModal(false);
    setSelectedUser(null);
    setEditingAbout(false);
    setEditedAbout('');
  };

  const handleSaveAbout = async () => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    try {
      // FIXED: Using /api/users/profile endpoint
      const response = await api.put('/users/profile', {
        about: editedAbout
      });

      if (response.data.success) {
        // Update local user data
        setSelectedUser(prev => ({
          ...prev,
          about: editedAbout
        }));
        setEditingAbout(false);
        
        // Update users list
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? { ...u, about: editedAbout } : u
        ));
      }
    } catch (err) {
      setError('Failed to save about');
      console.error(err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is 1x1 aspect ratio (approximately)
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const img = new Image();
        img.onload = async () => {
          // Allow some tolerance for 1x1 ratio (0.9 to 1.1)
          const aspectRatio = img.width / img.height;
          if (aspectRatio < 0.9 || aspectRatio > 1.1) {
            setError('Profile photo must be square (1:1 aspect ratio). Current ratio: ' + aspectRatio.toFixed(2) + ':1');
            return;
          }

          // Convert to base64
          setUploadingPhoto(true);
          const base64 = event.target.result;
          
          try {
            // FIXED: Using /api/users/profile endpoint
            const response = await api.put('/users/profile', {
              profilePhoto: base64
            });

            if (response.data.success) {
              setSelectedUser(prev => ({
                ...prev,
                profilePhoto: base64
              }));
              setUsers(prev => prev.map(u => 
                u.id === selectedUser.id ? { ...u, profilePhoto: base64 } : u
              ));
              setError('');
            }
          } catch (err) {
            setError('Failed to upload photo');
            console.error(err);
          } finally {
            setUploadingPhoto(false);
          }
        };
        img.src = event.target.result;
      } catch (err) {
        setError('Invalid image file');
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>👥 Browse Users</Typography>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      {/* Search Section */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, minWidth: 250 }}
          size="small"
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant={searchType === 'name' ? 'contained' : 'outlined'}
            onClick={() => setSearchType('name')}
            size="small"
          >
            By Name
          </Button>
          <Button 
            variant={searchType === 'course' ? 'contained' : 'outlined'}
            onClick={() => setSearchType('course')}
            size="small"
          >
            By Course
          </Button>
        </Box>
      </Box>

      {/* User Cards Grid - Compact */}
      <Grid container spacing={1}>
        {filteredUsers.map((userData) => (
          <Grid item xs={6} sm={4} md={3} lg={2.4} key={userData.id || userData._id}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 3
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => openUserProfile(userData)}
            >
              {/* Profile Photo - Small Square */}
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '1/1',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {userData.profilePhoto ? (
                  <Box
                    component="img"
                    src={userData.profilePhoto}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={userData.name}
                  />
                ) : (
                  <Typography sx={{ fontSize: '1.5rem' }}>👤</Typography>
                )}
              </Box>

              <CardContent sx={{ p: 0.75, flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#b30000', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                 🕵️ {userData.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#66ff66', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  📍 {userData.location || 'Unknown'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredUsers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" sx={{ color: '#999' }}>
            No users found
          </Typography>
        </Box>
      )}

      {/* User Profile Modal */}
      <Dialog 
        open={openProfileModal} 
        onClose={closeProfileModal}
        maxWidth="sm"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedUser.name}</Typography>
                <Typography variant="caption" sx={{ color: '#999' }}>@{selectedUser.username || selectedUser.email?.split('@')[0]}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pb: 2 }}>
              {/* Profile Photo Section */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
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
                  {selectedUser.profilePhoto ? (
                    <Box
                      component="img"
                      src={selectedUser.profilePhoto}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt={selectedUser.name}
                    />
                  ) : (
                    <Typography variant="h2" sx={{ color: '#999' }}>📸</Typography>
                  )}
                </Box>

                {user && (user.id === selectedUser.id || user._id === selectedUser._id) && (
                  <Box sx={{ mb: 2 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      style={{ display: 'none' }}
                      id="photo-input"
                    />
                    <label htmlFor="photo-input">
                      <Button
                        variant="outlined"
                        size="small"
                        component="span"
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                      </Button>
                    </label>
                  </Box>
                )}
              </Box>

              {/* User Info */}
              <Stack spacing={2} sx={{ mb: 3 }}>
                {selectedUser.course && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                      Course
                    </Typography>
                    <Typography variant="body2">{selectedUser.course}</Typography>
                  </Box>
                )}

                {selectedUser.age && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                      Age
                    </Typography>
                    <Typography variant="body2">{selectedUser.age} years old</Typography>
                  </Box>
                )}

                {selectedUser.location && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                      Location
                    </Typography>
                    <Typography variant="body2">{selectedUser.location}</Typography>
                  </Box>
                )}
              </Stack>

              {/* About Section */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                    About
                  </Typography>
                  {user && (user.id === selectedUser.id || user._id === selectedUser._id) && (
                    <Button
                      size="small"
                      startIcon={editingAbout ? <CancelIcon /> : <EditIcon />}
                      onClick={() => {
                        if (editingAbout) {
                          setEditedAbout(selectedUser.about || '');
                        }
                        setEditingAbout(!editingAbout);
                      }}
                    >
                      {editingAbout ? 'Cancel' : 'Edit'}
                    </Button>
                  )}
                </Box>

                {editingAbout ? (
                  <Box>
                    <TextareaAutosize
                      minRows={8}
                      value={editedAbout}
                      onChange={(e) => setEditedAbout(e.target.value)}
                      placeholder="Write about yourself..."
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
                      {editedAbout.length} characters
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveAbout}
                      sx={{ mt: 1 }}
                      fullWidth
                    >
                      Save About
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{
                    p: 1.5,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                    minHeight: 120,
                    maxHeight: 300,
                    overflowY: 'auto'
                  }}>
                    <Typography variant="body2">
                      {selectedUser.about || 'No information provided yet.'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={closeProfileModal}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default UsersBrowsePage;
