// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Users Management
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true
  });
  
  // Chat Messages Management
  const [chatMessages, setChatMessages] = useState([]);
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  
  // Blogs Management
  const [blogs, setBlogs] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlogs: 0,
    totalChatMessages: 0,
    activeUsers: 0
  });

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      return;
    }
    
    fetchDashboardData();
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [usersRes, blogsRes, chatRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/blogs'),
        api.get('/admin/chatmessages'),
        api.get('/admin/stats')
      ]);
      
      setUsers(usersRes.data.users || []);
      setBlogs(blogsRes.data.blogs || []);
      setChatMessages(chatRes.data.chatmessages || []);
      setStats(statsRes.data || {});
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // User Management Functions
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      isActive: user.isActive,
      password: ''
    });
    setOpenUserDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      if (selectedUser) {
        // Update existing user
        await api.put(`/admin/users/${selectedUser._id}`, userForm);
        setSuccess('User updated successfully!');
      } else {
        // Create new user
        await api.post('/admin/users', userForm);
        setSuccess('User created successfully!');
      }
      
      setOpenUserDialog(false);
      setSelectedUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'user', isActive: true });
      fetchDashboardData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${userId}`);
      setSuccess('User deleted successfully!');
      fetchDashboardData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}/toggle-status`);
      setSuccess(`User ${user.isActive ? 'blocked' : 'activated'}!`);
      fetchDashboardData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  // Chat Management Functions
  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Delete this chat message?')) return;
    
    try {
      await api.delete(`/admin/chatmessages/${chatId}`);
      setSuccess('Chat message deleted!');
      fetchDashboardData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete chat message');
    }
  };

  const handleViewChat = (chat) => {
    setSelectedChat(chat);
    setOpenChatDialog(true);
  };

  if (!isAdmin) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Admin access required. Please contact administrator.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          ✓ {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Typography variant="h4" sx={{ mb: 3 }}>Admin Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary">{stats.totalUsers || 0}</Typography>
            <Typography variant="body1">Total Users</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="secondary">{stats.activeUsers || 0}</Typography>
            <Typography variant="body1">Active Users</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">{stats.totalBlogs || 0}</Typography>
            <Typography variant="body1">Total Blogs</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="info.main">{stats.totalChatMessages || 0}</Typography>
            <Typography variant="body1">Chat Messages</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Users Management */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Users Management</Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              setSelectedUser(null);
              setUserForm({ name: '', email: '', password: '', role: 'user', isActive: true });
              setOpenUserDialog(true);
            }}
          >
            Add User
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role || 'user'} 
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isActive ? 'Active' : 'Blocked'} 
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEditUser(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleToggleUserStatus(user)}>
                      {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteUser(user._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Chat Messages Management */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Chat Messages</Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chatMessages.slice(0, 10).map((chat) => (
                <TableRow key={chat._id}>
                  <TableCell>{chat.sender?.name || 'Unknown'}</TableCell>
                  <TableCell>{chat.receiver?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {chat.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(chat.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleViewChat(chat)}>
                      View
                    </Button>
                    <IconButton size="small" color="error" onClick={() => handleDeleteChat(chat._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Blogs Management */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Recent Blogs</Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Views</TableCell>
                <TableCell>Likes</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blogs.slice(0, 10).map((blog) => (
                <TableRow key={blog._id}>
                  <TableCell>{blog.title}</TableCell>
                  <TableCell>{blog.author?.name || 'Unknown'}</TableCell>
                  <TableCell>{blog.views || 0}</TableCell>
                  <TableCell>{blog.likes || 0}</TableCell>
                  <TableCell>
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={blog.status || 'published'} 
                      color={blog.status === 'draft' ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Edit/Create Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={userForm.name}
            onChange={(e) => setUserForm({...userForm, name: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={userForm.password}
            onChange={(e) => setUserForm({...userForm, password: e.target.value})}
            margin="normal"
            helperText={selectedUser ? "Leave blank to keep current password" : "Required for new user"}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={userForm.role}
              label="Role"
              onChange={(e) => setUserForm({...userForm, role: e.target.value})}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={userForm.isActive}
              label="Status"
              onChange={(e) => setUserForm({...userForm, isActive: e.target.value})}
            >
              <MenuItem value={true}>Active</MenuItem>
              <MenuItem value={false}>Blocked</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat View Dialog */}
      <Dialog open={openChatDialog} onClose={() => setOpenChatDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chat Message Details</DialogTitle>
        <DialogContent>
          {selectedChat && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                <strong>From:</strong> {selectedChat.sender?.name} ({selectedChat.sender?.email})
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                <strong>To:</strong> {selectedChat.receiver?.name} ({selectedChat.receiver?.email})
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                <strong>Time:</strong> {new Date(selectedChat.createdAt).toLocaleString()}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="body1">{selectedChat.message}</Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChatDialog(false)}>Close</Button>
          {selectedChat && (
            <Button 
              color="error" 
              onClick={() => {
                handleDeleteChat(selectedChat._id);
                setOpenChatDialog(false);
              }}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
