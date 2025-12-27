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
  InputLabel,
  Badge,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FlagIcon from '@mui/icons-material/Flag';
import MailIcon from '@mui/icons-material/Mail';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [users, setUsers] = useState([]);
  const [allChatMessages, setAllChatMessages] = useState([]);
  const [reportedMessages, setReportedMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [blogs, setBlogs] = useState([]);

  // Dialog states
  const [selectedUser, setSelectedUser] = useState(null);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true
  });
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBlogs: 0,
    totalMessages: 0,
    reportedCount: 0,
    directCount: 0
  });

  // Fetch all data with timeout protection
  const fetchDashboardData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      setLoading(true);
      setError('');

      const [usersRes, blogsRes, chatRes, directRes] = await Promise.allSettled([
        api.get('/admin/users', { signal: controller.signal }).catch(() => api.get('/users')),
        api.get('/blog?limit=20'),
        api.get('/chatmessages'),
        api.get('/chatmessages/direct')
      ]);

      // Users
      let loadedUsers = [];
      if (usersRes.status === 'fulfilled') {
        loadedUsers = usersRes.value.data.users || usersRes.value.data.data || usersRes.value.data || [];
      }
      setUsers(loadedUsers);

      // Blogs
      let loadedBlogs = [];
      if (blogsRes.status === 'fulfilled') {
        loadedBlogs = blogsRes.value.data.blogs || blogsRes.value.data.data || [];
      }
      setBlogs(loadedBlogs);

      // All chat messages
      let loadedMessages = [];
      if (chatRes.status === 'fulfilled') {
        loadedMessages = chatRes.value.data.chatmessages || chatRes.value.data.messages || chatRes.value.data || [];
      }
      setAllChatMessages(loadedMessages);

      // Direct messages to admin
      let loadedDirect = [];
      if (directRes.status === 'fulfilled') {
        loadedDirect = directRes.value.data.messages || directRes.value.data.chatmessages || directRes.value.data || [];
      }
      setDirectMessages(loadedDirect);

      // Extract reported messages (assuming your backend adds a `reports` array or `reported: true`)
      const reported = loadedMessages.filter(msg => 
        msg.reported || (msg.reports && msg.reports.length > 0)
      );
      setReportedMessages(reported);

      // Calculate stats from fresh data
      setStats({
        totalUsers: loadedUsers.length,
        activeUsers: loadedUsers.filter(u => u.isActive !== false).length,
        totalBlogs: loadedBlogs.length,
        totalMessages: loadedMessages.length,
        reportedCount: reported.length,
        directCount: loadedDirect.length
      });

    } catch (err) {
      console.error('Dashboard load error:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out — some data may be missing');
      } else {
        setError('Failed to load dashboard data. Check connection.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [isAdmin]);

  // User management
  const handleEditUser = (userItem) => {
    setSelectedUser(userItem);
    setUserForm({
      name: userItem.name || '',
      email: userItem.email || '',
      role: userItem.role || 'user',
      isActive: userItem.isActive !== false,
      password: ''
    });
    setOpenUserDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      if (selectedUser) {
        await api.put(`/admin/users/${selectedUser._id}`, userForm);
        setSuccess('User updated!');
      } else {
        await api.post('/admin/users', userForm);
        setSuccess('User created!');
      }
      setOpenUserDialog(false);
      setSelectedUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'user', isActive: true });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setSuccess('User deleted');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userItem) => {
    if (!window.confirm(`Are you sure you want to ${userItem.isActive !== false ? 'block' : 'unblock'} this user?`)) return;
    try {
      await api.put(`/admin/users/${userItem._id}/status`, { isActive: userItem.isActive === false });
      setSuccess('User status updated');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  // Chat management
  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await api.delete(`/chatmessages/${chatId}`);
      setSuccess('Message deleted');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const handleViewChat = (chat) => {
    setSelectedChat(chat);
    setOpenChatDialog(true);
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (!isAdmin) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">Admin access required</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {(error || success) && (
        <Alert severity={error ? 'error' : 'success'} onClose={() => { setError(''); setSuccess(''); }} sx={{ mb: 3 }}>
          {error || success}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h4">{stats.totalUsers}</Typography>
            <Typography variant="body1">Total Users</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="h4">{stats.activeUsers}</Typography>
            <Typography variant="body1">Active Users</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
            <Typography variant="h4">{stats.totalBlogs}</Typography>
            <Typography variant="body1">Blogs</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
            <Typography variant="h4">{stats.totalMessages}</Typography>
            <Typography variant="body1">Messages</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
            <Badge badgeContent={stats.reportedCount} color="default">
              <Typography variant="h4">{stats.reportedCount}</Typography>
            </Badge>
            <Typography variant="body1">Reported</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'secondary.main', color: 'white' }}>
            <Badge badgeContent={stats.directCount} color="default">
              <Typography variant="h4">{stats.directCount}</Typography>
            </Badge>
            <Typography variant="body1">Direct Msgs</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Users Management</Typography>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => {
            setSelectedUser(null);
            setUserForm({ name: '', email: '', password: '', role: 'user', isActive: true });
            setOpenUserDialog(true);
          }}>
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
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No users found</TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {u.name || 'No name'}
                        {u._id === user?._id && <Chip label="You" size="small" color="primary" />}
                      </Box>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip label={u.role || 'user'} color={u.role === 'admin' ? 'primary' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={u.isActive !== false ? 'Active' : 'Blocked'} color={u.isActive !== false ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditUser(u)}><EditIcon /></IconButton>
                      <IconButton size="small" onClick={() => handleToggleUserStatus(u)}>
                        {u.isActive !== false ? <BlockIcon /> : <CheckCircleIcon />}
                      </IconButton>
                      {u._id !== user?._id && (
                        <IconButton size="small" color="error" onClick={() => handleDeleteUser(u._id)}><DeleteIcon /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Reported Messages */}
      {reportedMessages.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, border: '2px solid #d32f2f' }}>
          <Typography variant="h5" sx={{ mb: 3, color: '#d32f2f', display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlagIcon /> Reported Messages ({reportedMessages.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>From</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Reports</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportedMessages.map((msg) => (
                  <TableRow key={msg._id} sx={{ bgcolor: '#ffebee' }}>
                    <TableCell>{msg.sender?.name || 'Unknown'}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Tooltip title={msg.content}><span>{msg.content}</span></Tooltip>
                    </TableCell>
                    <TableCell>{msg.reports?.length || 1}</TableCell>
                    <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleViewChat(msg)}><VisibilityIcon /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteChat(msg._id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Direct Messages */}
      {directMessages.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, border: '2px solid #7b1fa2' }}>
          <Typography variant="h5" sx={{ mb: 3, color: '#7b1fa2', display: 'flex', alignItems: 'center', gap: 1 }}>
            <MailIcon /> Direct Messages to Admin ({directMessages.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>From</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {directMessages.map((msg) => (
                  <TableRow key={msg._id}>
                    <TableCell>{msg.sender?.name || msg.senderName || 'User'}</TableCell>
                    <TableCell sx={{ maxWidth: 400 }}>{msg.content}</TableCell>
                    <TableCell>{new Date(msg.createdAt || msg.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleViewChat(msg)}><VisibilityIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Recent Public Messages */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Recent Public Messages</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>From</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allChatMessages.slice(0, 15).map((msg) => (
                <TableRow key={msg._id}>
                  <TableCell>{msg.sender?.name || 'Unknown'}</TableCell>
                  <TableCell sx={{ maxWidth: 500 }}>{msg.content}</TableCell>
                  <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleViewChat(msg)}><VisibilityIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteChat(msg._id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Blogs Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Recent Blogs</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Views / Likes</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blogs.slice(0, 10).map((blog) => (
                <TableRow key={blog._id}>
                  <TableCell>{blog.title}</TableCell>
                  <TableCell>{blog.author?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge badgeContent={blog.views || 0} color="primary" sx={{ mr: 2 }} />
                    <Badge badgeContent={blog.likes || 0} color="secondary" />
                  </TableCell>
                  <TableCell>{new Date(blog.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialogs remain the same */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} margin="normal" required />
          <TextField fullWidth label="Password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} margin="normal"
            helperText={selectedUser ? "Leave blank to keep current" : "Required for new user"} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select value={userForm.isActive} onChange={(e) => setUserForm({ ...userForm, isActive: e.target.value })}>
              <MenuItem value={true}>Active</MenuItem>
              <MenuItem value={false}>Blocked</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">{selectedUser ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openChatDialog} onClose={() => setOpenChatDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Message Details</DialogTitle>
        <DialogContent dividers>
          {selectedChat && (
            <Box>
              <Typography><strong>From:</strong> {selectedChat.sender?.name || selectedChat.senderName || 'Unknown'}</Typography>
              <Typography><strong>Type:</strong> {selectedChat.type === 'direct' ? 'Direct to Admin' : 'Public'}</Typography>
              <Typography><strong>Time:</strong> {new Date(selectedChat.createdAt || selectedChat.timestamp).toLocaleString()}</Typography>
              {selectedChat.reported && <Alert severity="warning" sx={{ mt: 2 }}>This message was reported by users</Alert>}
              <Box sx={{ mt: 3, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body1">{selectedChat.content}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChatDialog(false)}>Close</Button>
          {selectedChat && (
            <Button color="error" onClick={() => { handleDeleteChat(selectedChat._id); setOpenChatDialog(false); }}>
              Delete Message
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
