import React, { useState, useEffect } from 'react';
import {
  Container,
  Tabs,
  Tab,
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  Grid,
  FormControl,   // ← FIXED: Added
  InputLabel,    // ← FIXED: Added
  Select,        // ← FIXED: Added
  MenuItem       // ← FIXED: Added
} from '@mui/material';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FlagIcon from '@mui/icons-material/Flag';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState('users');

  // Data
  const [users, setUsers] = useState([]);
  const [publicMessages, setPublicMessages] = useState([]);
  const [reportedMessages, setReportedMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [blogs, setBlogs] = useState([]);

  // Dialogs
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);

  // Mass Message
  const [openMassDialog, setOpenMassDialog] = useState(false);
  const [massContent, setMassContent] = useState('');
  const [massFilter, setMassFilter] = useState('all'); // all, course, location
  const [massValue, setMassValue] = useState('');

  // Notification
  const [openNotifDialog, setOpenNotifDialog] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBlogs: 0,
    totalMessages: 0,
    reportedCount: 0,
    directCount: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch users
      let loadedUsers = [];
      const userEndpoints = ['/api/admin/users', '/api/users', '/users'];
      for (const endpoint of userEndpoints) {
        try {
          const res = await api.get(endpoint);
          const data = res.data.users || res.data.data || res.data || [];
          if (Array.isArray(data) && data.length > 0) {
            loadedUsers = data;
            break;
          }
        } catch (e) {
          // continue
        }
      }
      setUsers(loadedUsers);

      // Fetch blogs
      let loadedBlogs = [];
      try {
        const res = await api.get('/api/blog');
        loadedBlogs = res.data.blogs || res.data.data || res.data || [];
      } catch (e) {
        console.log('Blogs fetch failed');
      }
      setBlogs(loadedBlogs);

      // Fetch public messages
      let loadedPublic = [];
      try {
        const res = await api.get('/chatmessages');
        loadedPublic = res.data.messages || res.data.chatmessages || res.data.data || [];
      } catch (e) {
        console.log('Public messages fetch failed');
      }
      setPublicMessages(loadedPublic);

      // Fetch direct messages
      let loadedDirect = [];
      try {
        const res = await api.get('/chatmessages/direct');
        loadedDirect = res.data.messages || res.data.chatmessages || res.data.data || [];
      } catch (e) {
        console.log('Direct messages fetch failed');
      }
      setDirectMessages(loadedDirect);

      // Reported messages
      const reported = loadedPublic.filter(m => m.reported || (m.reports && m.reports.length > 0));
      setReportedMessages(reported);

      // Update stats
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setError('Admin access required');
      setLoading(false);
      return;
    }
    fetchData();
  }, [isAdmin]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: false });
      setSuccess('User deactivated');
      fetchData();
    } catch (e) {
      setError('Failed to deactivate user');
    }
  };

  const handleActivate = async (userId) => {
    if (!window.confirm('Activate this user?')) return;
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive: true });
      setSuccess('User activated');
      fetchData();
    } catch (e) {
      setError('Failed to activate user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setSuccess('User deleted');
      fetchData();
    } catch (e) {
      setError('Failed to delete user');
    }
  };

  const handleViewMessage = (msg) => {
    setSelectedMessage(msg);
    setOpenMessageDialog(true);
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/chatmessages/${msgId}`);
      setSuccess('Message deleted');
      fetchData();
    } catch (e) {
      setError('Failed to delete message');
    }
  };

  const handleSendMassMessage = async () => {
    if (!massContent.trim()) {
      setError('Message content required');
      return;
    }
    try {
      const payload = {
        content: massContent,
        filterType: massFilter,
        filterValue: massFilter === 'all' ? null : massValue
      };
      await api.post('/api/admin/mass-message', payload);
      setSuccess('Mass message sent!');
      setOpenMassDialog(false);
      setMassContent('');
      setMassValue('');
    } catch (e) {
      setError('Failed to send mass message');
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      setError('Title and body required');
      return;
    }
    try {
      await api.post('/api/notifications/send', {
        title: notifTitle,
        body: notifBody
      });
      setSuccess('Notification sent to all users!');
      setOpenNotifDialog(false);
      setNotifTitle('');
      setNotifBody('');
    } catch (e) {
      setError('Failed to send notification');
    }
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
        <CircularProgress size={60} />
        <Typography sx={{ ml: 2 }}>Loading dashboard...</Typography>
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

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SendIcon />}
            onClick={() => setOpenMassDialog(true)}
          >
            Send Mass Message
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<NotificationsActiveIcon />}
            onClick={() => setOpenNotifDialog(true)}
          >
            Send Notification
          </Button>
        </Grid>
      </Grid>

      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label={`Users (${stats.totalUsers})`} value="users" />
            <Tab label={`Reported (${stats.reportedCount})`} value="reported" />
            <Tab label={`Blogs (${stats.totalBlogs})`} value="blogs" />
            <Tab label={`Direct (${stats.directCount})`} value="direct" />
          </Tabs>
        </Box>

        <TabPanel value="users">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>User Management</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Chip label={u.role} size="small" /></TableCell>
                      <TableCell>
                        <Chip label={u.isActive !== false ? 'Active' : 'Blocked'} color={u.isActive !== false ? 'success' : 'error'} size="small" />
                      </TableCell>
                      <TableCell>{u.course || 'N/A'}</TableCell>
                      <TableCell>{u.location || 'N/A'}</TableCell>
                      <TableCell>
                        {u.isActive !== false ? (
                          <Tooltip title="Deactivate">
                            <IconButton onClick={() => handleDeactivate(u._id)}><BlockIcon /></IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Activate">
                            <IconButton onClick={() => handleActivate(u._id)}><CheckCircleIcon color="success" /></IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDeleteUser(u._id)}><DeleteIcon /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value="reported">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Reported Messages</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>From</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportedMessages.map((msg) => (
                    <TableRow key={msg._id}>
                      <TableCell>{msg.sender?.name || 'Unknown'}</TableCell>
                      <TableCell>{msg.content.substring(0, 100)}...</TableCell>
                      <TableCell>{msg.reports?.[0]?.reason || 'N/A'}</TableCell>
                      <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleViewMessage(msg)}><VisibilityIcon /></IconButton>
                        <IconButton color="error" onClick={() => handleDeleteMessage(msg._id)}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value="blogs">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Recent Blogs</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog._id}>
                      <TableCell>{blog.title}</TableCell>
                      <TableCell>{blog.author?.name || 'Unknown'}</TableCell>
                      <TableCell>{new Date(blog.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value="direct">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Direct Messages</Typography>
            <TableContainer>
              <Table>
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
                      <TableCell>{msg.sender?.name || msg.senderName}</TableCell>
                      <TableCell>{msg.content}</TableCell>
                      <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleViewMessage(msg)}><VisibilityIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>
      </TabContext>

      {/* Message View Dialog */}
      <Dialog open={openMessageDialog} onClose={() => setOpenMessageDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Message Details</DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Box>
              <Typography><strong>From:</strong> {selectedMessage.sender?.name || 'Unknown'}</Typography>
              <Typography><strong>Time:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}</Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography>{selectedMessage.content}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMessageDialog(false)}>Close</Button>
          {selectedMessage && (
            <Button color="error" onClick={() => {
              handleDeleteMessage(selectedMessage._id);
              setOpenMessageDialog(false);
            }}>
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Mass Message Dialog */}
      <Dialog open={openMassDialog} onClose={() => setOpenMassDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Mass Message</DialogTitle>
        <DialogContent>
          <TextField
            label="Message"
            multiline
            rows={4}
            fullWidth
            value={massContent}
            onChange={(e) => setMassContent(e.target.value)}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Send To</InputLabel>
            <Select value={massFilter} onChange={(e) => setMassFilter(e.target.value)}>
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="course">By Course</MenuItem>
              <MenuItem value="location">By Location</MenuItem>
            </Select>
          </FormControl>
          {massFilter !== 'all' && (
            <TextField
              label={`Enter ${massFilter}`}
              fullWidth
              value={massValue}
              onChange={(e) => setMassValue(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMassDialog(false)}>Cancel</Button>
          <Button onClick={handleSendMassMessage} variant="contained" color="secondary">
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={openNotifDialog} onClose={() => setOpenNotifDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Global Notification</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            value={notifTitle}
            onChange={(e) => setNotifTitle(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Body"
            multiline
            rows={4}
            fullWidth
            value={notifBody}
            onChange={(e) => setNotifBody(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotifDialog(false)}>Cancel</Button>
          <Button onClick={handleSendNotification} variant="contained">
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
