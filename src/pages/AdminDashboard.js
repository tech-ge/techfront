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
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
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
  const [tabValue, setTabValue] = useState('users');

  // Data states
  const [users, setUsers] = useState([]);
  const [publicMessages, setPublicMessages] = useState([]);
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
  const [openMassMessageDialog, setOpenMassMessageDialog] = useState(false);
  const [massMessage, setMassMessage] = useState('');
  const [massTag, setMassTag] = useState('');
  const [massCourse, setMassCourse] = useState('');
  const [massLocation, setMassLocation] = useState('');

  // Stats
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
          if (Array.isArray(data) && data.length > 0) {
            loadedUsers = data;
            break;
          }
        } catch (err) {
          console.log(`Failed ${endpoint}:`, err.message);
        }
      }

      setUsers(loadedUsers);

      // Load blogs (fixed fetch - added /api/blog)
      let loadedBlogs = [];
      try {
        const res = await api.get('/api/blog?limit=20');
        loadedBlogs = res.data.blogs || res.data.data || res.data || [];
      } catch (err) {
        console.log('Blogs failed:', err);
      }
      setBlogs(loadedBlogs);

      // Load public messages
      let loadedPublic = [];
      try {
        const res = await api.get('/chatmessages');
        loadedPublic = res.data.messages || res.data.chatmessages || res.data.data || [];
      } catch (err) {
        console.log('Public messages failed:', err);
      }
      setPublicMessages(loadedPublic);

      // Load direct messages
      let loadedDirect = [];
      try {
        const res = await api.get('/chatmessages/direct');
        loadedDirect = res.data.messages || res.data.chatmessages || res.data.data || [];
      } catch (err) {
        console.log('Direct messages failed:', err);
      }
      setDirectMessages(loadedDirect);

      // Reported messages
      const reported = loadedPublic.filter(msg => 
        msg.reported || (msg.reports && msg.reports.length > 0)
      );
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
      setError('Failed to load data. Check connection.');
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

  // Auto-clear alerts
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
    if (!window.confirm('Delete user permanently?')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setSuccess('User deleted');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleApproveReport = async (reportId, messageId) => {
    if (!window.confirm('Approve report and delete message?')) return;
    try {
      await api.put(`/chatmessages/reports/${reportId}/action`, { action: 'approve' });
      setSuccess('Report approved and message deleted');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to approve report');
    }
  };

  const handleRejectReport = async (reportId) => {
    if (!window.confirm('Reject report?')) return;
    try {
      await api.put(`/chatmessages/reports/${reportId}/action`, { action: 'reject' });
      setSuccess('Report rejected');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to reject report');
    }
  };

  const handleReplyDirect = async (messageId, replyContent) => {
    try {
      await api.post(`/chatmessages/direct/reply/${messageId}`, { content: replyContent });
      setSuccess('Reply sent');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to send reply');
    }
  };

  const handleSendMassMessage = async () => {
    try {
      await api.post('/api/admin/messages/mass', { message: massMessage, tag: massTag, course: massCourse, location: massLocation });
      setSuccess('Mass message sent');
      setOpenMassMessageDialog(false);
      setMassMessage('');
      setMassTag('');
      setMassCourse('');
      setMassLocation('');
    } catch (err) {
      setError('Failed to send mass message');
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Delete message permanently?')) return;
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab label="Users" value="users" />
            <Tab label="Reported" value="reported" />
            <Tab label="Blogs" value="blogs" />
            <Tab label="Direct Msgs" value="direct" />
            <Tab label="Stats" value="stats" />
            <Tab label="Mass Msg" value="mass" />
          </Tabs>
        </Box>
        <TabPanel value="users">
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">Users ({stats.totalUsers})</Typography>
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
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>{u.status}</TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleDeactivateUser(u._id)}><BlockIcon /></IconButton>
                        <IconButton onClick={() => handleActivateUser(u._id)}><CheckCircleIcon /></IconButton>
                        <IconButton color="error" onClick={() => handleDeleteUser(u._id)}><DeleteIcon /></IconButton>
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
            <Typography variant="h5" sx={{ mb: 3 }}>Reported Messages ({stats.reportedCount})</Typography>
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
                      <TableCell>{msg.sender?.name}</TableCell>
                      <TableCell>{msg.content}</TableCell>
                      <TableCell>{msg.reports[0]?.reason}</TableCell>
                      <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleApproveReport(msg.reports[0]?.id, msg._id)}>Approve & Delete</Button>
                        <Button onClick={() => handleRejectReport(msg.reports[0]?.id)}>Reject</Button>
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
            <Typography variant="h5" sx={{ mb: 3 }}>Blogs ({stats.totalBlogs})</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Views</TableCell>
                    <TableCell>Likes</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog._id}>
                      <TableCell>{blog.title}</TableCell>
                      <TableCell>{blog.author?.name}</TableCell>
                      <TableCell>{blog.views}</TableCell>
                      <TableCell>{blog.likes}</TableCell>
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
            <Typography variant="h5" sx={{ mb: 3 }}>Direct Messages ({stats.directCount})</Typography>
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
                      <TableCell>{msg.sender?.name}</TableCell>
                      <TableCell>{msg.content}</TableCell>
                      <TableCell>{new Date(msg.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleReplyDirect(msg._id, 'Your reply text')}>Reply</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>
        <TabPanel value="stats">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Platform Stats</Typography>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography>Total Users: {stats.totalUsers}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>Active Users: {stats.activeUsers}</Typography>
              </Grid>
              <Grid item xs= {6}>
                <Typography>Total Blogs: {stats.totalBlogs}</Typography>
              </Grid>
              <Grid item xs= {6}>
                <Typography>Total Messages: {stats.totalMessages}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>
        <TabPanel value="mass">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Send Mass Message</Typography>
            <Button variant="contained" onClick={() => setOpenMassMessageDialog(true)}>Send Mass Message</Button>
            <Dialog open={openMassMessageDialog} onClose={() => setOpenMassMessageDialog(false)}>
              <DialogTitle>Send Mass Message</DialogTitle>
              <DialogContent>
                <TextField label="Message" value={massMessage} onChange={(e) => setMassMessage(e.target.value)} multiline rows={4} fullWidth />
                <TextField label="Tag" value={massTag} onChange={(e) => setMassTag(e.target.value)} fullWidth sx={{ mt: 2 }} />
                <TextField label="Course" value={massCourse} onChange={(e) => setMassCourse(e.target.value)} fullWidth sx={{ mt: 2 }} />
                <TextField label="Location" value={massLocation} onChange={(e) => setMassLocation(e.target.value)} fullWidth sx={{ mt: 2 }} />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenMassMessageDialog(false)}>Cancel</Button>
                <Button onClick={handleSendMassMessage} variant="contained">Send</Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </TabPanel>
      </TabContext>

      {/* Dialogs */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} fullWidth />
          <TextField label="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} fullWidth />
          <TextField label="Password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openChatDialog} onClose={() => setOpenChatDialog(false)}>
        <DialogTitle>Message Details</DialogTitle>
        <DialogContent>
          {selectedChat && (
            <Box>
              <Typography>From: {selectedChat.sender?.name}</Typography>
              <Typography>Content: {selectedChat.content}</Typography>
              <Typography>Time: {new Date(selectedChat.createdAt).toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChatDialog(false)}>Close</Button>
          <Button onClick={() => handleDeleteChat(selectedChat._id)} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
