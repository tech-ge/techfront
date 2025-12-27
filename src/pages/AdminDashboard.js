import React, { useState, useEffect } from 'react';
import {
  Container,
  Tabs,
  Tab,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip
} from '@mui/material';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const [tabValue, setTabValue] = useState('users');

  const [users, setUsers] = useState([]);
  const [publicMessages, setPublicMessages] = useState([]);
  const [reportedMessages, setReportedMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [blogs, setBlogs] = useState([]);

  const [selectedChat, setSelectedChat] = useState(null);
  const [openChatDialog, setOpenChatDialog] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBlogs: 0,
    totalMessages: 0,
    reportedCount: 0,
    directCount: 0
  });

  const fetchDashboardData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      setLoading(true);
      setError('');

      let loadedUsers = [];

      const userEndpoints = [
        '/api/admin/users',
        '/api/users',
        '/admin/users',
        '/users'
      ];

      for (const endpoint of userEndpoints) {
        try {
          const res = await api.get(endpoint, { signal: controller.signal });
          const data = res.data.users || res.data.data || res.data || [];
          if (Array.isArray(data)) {
            loadedUsers = data;
            break;
          }
        } catch (err) {
          console.log(`Failed ${endpoint}:`, err.message);
        }
      }

      setUsers(loadedUsers);

      let loadedBlogs = [];
      try {
        const res = await api.get('/api/blog?limit=20');
        loadedBlogs = res.data.blogs || res.data.data || res.data || [];
      } catch (err) {
        console.log('Blogs failed');
      }
      setBlogs(loadedBlogs);

      let loadedPublic = [];
      try {
        const res = await api.get('/chatmessages');
        loadedPublic = res.data.messages || res.data.chatmessages || res.data.data || [];
      } catch (err) {
        console.log('Public messages failed');
      }
      setPublicMessages(loadedPublic);

      let loadedDirect = [];
      try {
        const res = await api.get('/chatmessages/direct');
        loadedDirect = res.data.messages || res.data.chatmessages || res.data.data || [];
      } catch (err) {
        console.log('Direct messages failed');
      }
      setDirectMessages(loadedDirect);

      const reported = loadedPublic.filter(msg => 
        msg.reported || (msg.reports && msg.reports.length > 0)
      );
      setReportedMessages(reported);

      setStats({
        totalUsers: loadedUsers.length,
        activeUsers: loadedUsers.filter(u => u.isActive !== false).length,
        totalBlogs: loadedBlogs.length,
        totalMessages: loadedPublic.length,
        reportedCount: reported.length,
        directCount: loadedDirect.length
      });

    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setError('Admin access required');
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [isAdmin]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: false });
      setSuccess('User deactivated');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to deactivate user');
    }
  };

  const handleActivateUser = async (userId) => {
    if (!window.confirm('Activate this user?')) return;
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: true });
      setSuccess('User activated');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to activate user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setSuccess('User deleted');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

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
        <CircularProgress />
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

      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Users" value="users" />
            <Tab label={`Reported (${stats.reportedCount})`} value="reported" />
            <Tab label={`Blogs (${stats.totalBlogs})`} value="blogs" />
            <Tab label={`Direct (${stats.directCount})`} value="direct" />
          </Tabs>
        </Box>

        <TabPanel value="users">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Users Management ({stats.totalUsers})</Typography>
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
                    <TableRow>
                      <TableCell colSpan={6} align="center">No users found</TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell>{u.name || 'N/A'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Chip label={u.role || 'user'} color={u.role === 'admin' ? 'primary' : 'default'} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={u.isActive !== false ? 'Active' : 'Blocked'} color={u.isActive !== false ? 'success' : 'error'} size="small" />
                        </TableCell>
                        <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          {u.isActive !== false ? (
                            <Tooltip title="Deactivate">
                              <IconButton onClick={() => handleDeactivateUser(u._id)}><BlockIcon /></IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Activate">
                              <IconButton onClick={() => handleActivateUser(u._id)}><CheckCircleIcon color="success" /></IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton color="error" onClick={() => handleDeleteUser(u._id)}><DeleteIcon /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value="reported">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Reported Messages ({stats.reportedCount})</Typography>
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
                  {reportedMessages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No reported messages</TableCell>
                    </TableRow>
                  ) : (
                    reportedMessages.map((msg) => (
                      <TableRow key={msg._id} sx={{ bgcolor: '#ffebee' }}>
                        <TableCell>{msg.sender?.name || 'Unknown'}</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Tooltip title={msg.content}><span>{msg.content.substring(0, 50)}...</span></Tooltip>
                        </TableCell>
                        <TableCell>{msg.reports?.length || 1}</TableCell>
                        <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleViewChat(msg)}><VisibilityIcon /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteChat(msg._id)}><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value="blogs">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Recent Blogs ({stats.totalBlogs})</Typography>
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
                  {blogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No blogs found</TableCell>
                    </TableRow>
                  ) : (
                    blogs.slice(0, 10).map((blog) => (
                      <TableRow key={blog._id}>
                        <TableCell>{blog.title}</TableCell>
                        <TableCell>{blog.author?.name || 'Unknown'}</TableCell>
                        <TableCell>{blog.views || 0} / {blog.likes || 0}</TableCell>
                        <TableCell>{new Date(blog.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value="direct">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Direct Messages to Admin ({stats.directCount})</Typography>
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
                  {directMessages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No direct messages</TableCell>
                    </TableRow>
                  ) : (
                    directMessages.map((msg) => (
                      <TableRow key={msg._id}>
                        <TableCell>{msg.sender?.name || msg.senderName || 'User'}</TableCell>
                        <TableCell sx={{ maxWidth: 400 }}>{msg.content}</TableCell>
                        <TableCell>{new Date(msg.createdAt || msg.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleViewChat(msg)}><VisibilityIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>
      </TabContext>

      <Dialog open={openChatDialog} onClose={() => setOpenChatDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Message Details</DialogTitle>
        <DialogContent dividers>
          {selectedChat && (
            <Box>
              <Typography><strong>From:</strong> {selectedChat.sender?.name || selectedChat.senderName || 'Unknown'}</Typography>
              <Typography><strong>Type:</strong> {selectedChat.type === 'direct' ? 'Direct to Admin' : 'Public'}</Typography>
              <Typography><strong>Time:</strong> {new Date(selectedChat.createdAt || selectedChat.timestamp).toLocaleString()}</Typography>
              {selectedChat.reported && <Alert severity="warning" sx={{ mt: 2 }}>Reported by users</Alert>}
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
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
