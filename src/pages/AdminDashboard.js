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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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

        {/* Your TabPanel content here (users, reported, blogs, direct) */}
        {/* ... keep your existing TabPanel content ... */}
      </TabContext>

      {/* Mass Message Dialog - Now using Radio Buttons */}
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
          <FormLabel component="legend" sx={{ mt: 3 }}>Send To</FormLabel>
          <RadioGroup value={massFilter} onChange={(e) => setMassFilter(e.target.value)}>
            <FormControlLabel value="all" control={<Radio />} label="All Users" />
            <FormControlLabel value="course" control={<Radio />} label="By Course" />
            <FormControlLabel value="location" control={<Radio />} label="By Location" />
          </RadioGroup>
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

      {/* Keep your other dialogs and content */}
    </Container>
  );
};

export default AdminDashboard;
