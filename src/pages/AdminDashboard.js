import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
  TextField,
  MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import api from '../utils/api';

const AdminDashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportActionLoading, setReportActionLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportAction, setReportAction] = useState('');
  
  // Notification states
  const [openNotificationDialog, setOpenNotificationDialog] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState('');

  // Direct messages states
  const [directMessages, setDirectMessages] = useState([]);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedDirectMsg, setSelectedDirectMsg] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
    if (tabValue === 1) {
      fetchReports();
    }
    if (tabValue === 3) {
      fetchDirectMessages();
    }
  }, [isAdmin, navigate, tabValue]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const response = await api.get('/chat/reports/all');
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setError(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setOpenDialog(true);
  };

  const confirmAction = async () => {
    try {
      setActionLoading(true);
      
      if (actionType === 'approve' || actionType === 'deactivate') {
        const newStatus = actionType === 'approve' ? 'active' : 'deactivated';
        await api.put(`/admin/users/${selectedUser.id}/status`, { status: newStatus });
      } else if (actionType === 'delete') {
        await api.delete(`/admin/users/${selectedUser.id}`);
      }
      
      setOpenDialog(false);
      setError('');
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Action failed:', error);
      setError(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      setSendingNotification(true);
      setError('');
      
      // Send via API to save it
      const response = await api.post('/notifications', {
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType
      });

      // Also broadcast via Socket.io for real-time
      const socket = require('socket.io-client')('wss://your-project.up.railway.app');
      socket.emit('send-notification', response.data.notification);
      socket.disconnect();

      setNotificationSuccess('Notification sent successfully!');
      setOpenNotificationDialog(false);
      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationType('info');
      
      setTimeout(() => setNotificationSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to send notification:', error);
      setError(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const fetchDirectMessages = async () => {
    try {
      setLoadingDirect(true);
      const response = await api.get('/messages/admin/direct');
      setDirectMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch direct messages:', error);
      setError('Failed to load direct messages');
    } finally {
      setLoadingDirect(false);
    }
  };

  const getConversationThreads = () => {
    // Group messages by user (sender)
    const conversations = {};
    
    directMessages.forEach(msg => {
      const userId = msg.sender;
      if (!conversations[userId]) {
        conversations[userId] = {
          userId,
          userName: msg.senderName,
          messages: [],
          lastMessage: msg
        };
      }
      conversations[userId].messages.push(msg);
      conversations[userId].lastMessage = msg;
    });

    // Sort by most recent and return as array
    return Object.values(conversations)
      .sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
  };

  const handleReplyToDirectMessage = async (messageId) => {
    if (!replyText.trim()) return;

    try {
      setSendingReply(true);
      await api.post(`/messages/admin/direct/reply/${messageId}`, {
        content: replyText
      });
      setReplyText('');
      setSelectedDirectMsg(null);
      fetchDirectMessages();
      setNotificationSuccess('Reply sent successfully!');
      setTimeout(() => setNotificationSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to send reply:', error);
      setError('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleReportAction = (report, action) => {
    setSelectedReport(report);
    setReportAction(action);
    setOpenDialog(true);
  };

  const confirmReportAction = async () => {
    try {
      setReportActionLoading(true);
      await api.put(`/chat/reports/${selectedReport.id}/action`, { action: reportAction });
      setOpenDialog(false);
      setError('');
      fetchReports(); // Refresh reports
    } catch (error) {
      console.error('Report action failed:', error);
      setError(error.response?.data?.message || 'Action failed');
    } finally {
      setReportActionLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      active: 'success',
      deactivated: 'error',
      pending_approval: 'warning'
    };
    return <Chip label={status} color={colors[status]} size="small" />;
  };

  const getRoleChip = (role) => {
    return <Chip label={role} color={role === 'admin' ? 'primary' : 'default'} size="small" />;
  };

  if (!isAdmin()) {
    return (
      <Container>
        <Typography>Access denied. Admin privileges required.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Admin Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #d883dbff 0%, #a84ac0ff 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1">
          Welcome, Admin {user?.name}. Manage users, content, and platform settings.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/chat')}
            sx={{ backgroundColor: 'white', color: '#14f0ddff' }}
          >
            Join Chat as Admin
          </Button>
          <Button 
            variant="outlined" 
            onClick={logout}
            sx={{ borderColor: 'white', color: 'white' }}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {notificationSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotificationSuccess('')}>
          {notificationSuccess}
        </Alert>
      )}

      {/* Send Notification Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<NotificationsIcon />}
          onClick={() => setOpenNotificationDialog(true)}
          sx={{ backgroundColor: '#44d219ff' }}
        >
          Send Notification
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="User Management" />
          <Tab label="Reported Content" />
          <Tab label="Blog Moderation" />
          <Tab label="Direct Messages" />
          <Tab label="Platform Stats" />
        </Tabs>
      </Paper>

      {/* Tab Content - User Management */}
      {tabValue === 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h5">User Management</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage all registered users on the platform
              </Typography>
            </Box>
            <Button onClick={fetchUsers} variant="outlined" size="small">
              Refresh
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total Users: <strong>{users.length}</strong>
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#5ead54ff' }}>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>University</strong></TableCell>
                    <TableCell><strong>Course</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Joined</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No users found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.university}</TableCell>
                        <TableCell>{user.course}</TableCell>
                        <TableCell>{getStatusChip(user.status)}</TableCell>
                        <TableCell>{getRoleChip(user.role)}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          {user.role !== 'admin' && (
                            <>
                              {user.status !== 'active' && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleAction(user, 'approve')}
                                  title="Approve/Activate"
                                >
                                  <CheckCircleIcon color="success" />
                                </IconButton>
                              )}
                              {user.status !== 'deactivated' && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleAction(user, 'deactivate')}
                                  title="Deactivate"
                                >
                                  <BlockIcon color="error" />
                                </IconButton>
                              )}
                              <IconButton 
                                size="small" 
                                onClick={() => handleAction(user, 'delete')}
                                title="Delete"
                              >
                                <DeleteIcon color="action" />
                              </IconButton>
                            </>
                          )}
                          {user.role === 'admin' && (
                            <Typography variant="caption" color="text.secondary">Admin</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Tab Content - Reported Content */}
      {tabValue === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h5">Reported Messages</Typography>
              <Typography variant="body2" color="text.secondary">
                Review and take action on reported chat messages
              </Typography>
            </Box>
            <Button onClick={fetchReports} variant="outlined" size="small">
              Refresh
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total Reports: <strong>{reports.length}</strong> |
            Pending: <strong>{reports.filter(r => r.status === 'pending').length}</strong> |
            Approved: <strong>{reports.filter(r => r.status === 'approved').length}</strong>
          </Typography>

          {loadingReports ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Reported By</strong></TableCell>
                    <TableCell><strong>Reported Message</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No reports found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id} hover>
                        <TableCell>{report.reportedByName}</TableCell>
                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {report.messageContent.substring(0, 100)}...
                        </TableCell>
                        <TableCell>{report.reason}</TableCell>
                        <TableCell>
                          <Chip 
                            label={report.status} 
                            color={
                              report.status === 'pending' ? 'warning' :
                              report.status === 'approved' ? 'error' :
                              'success'
                            } 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          {new Date(report.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          {report.status === 'pending' && (
                            <>
                              <Button 
                                size="small" 
                                color="error" 
                                onClick={() => handleReportAction(report, 'approve')}
                              >
                                Delete
                              </Button>
                              <Button 
                                size="small" 
                                color="inherit" 
                                onClick={() => handleReportAction(report, 'reject')}
                              >
                                Keep
                              </Button>
                            </>
                          )}
                          {report.status !== 'pending' && (
                            <Typography variant="caption" color="text.secondary">
                              {report.status === 'approved' ? 'Deleted' : 'Kept'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Tab Content - Blog Moderation */}
      {tabValue === 2 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Blog Moderation</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            This section will show all blogs for moderation. No blogs posted yet.
          </Alert>
        </Paper>
      )}

      {/* Tab Content - Direct Messages */}
      {tabValue === 3 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>👥 User Support Messages</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            View and respond to direct messages from users - organized by conversation
          </Typography>
          
          {loadingDirect ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : directMessages.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
              No messages yet
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {getConversationThreads().map((conversation) => (
                <Paper key={conversation.userId} sx={{ p: 2, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0' }}>
                  {/* Conversation Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: '2px solid #e0e0e0' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        💬 {conversation.userName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''} • Last: {new Date(conversation.lastMessage.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip label={`Unread: ${conversation.messages.filter(m => !m.respondingTo).length}`} color="primary" size="small" />
                  </Box>

                  {/* Conversation Messages */}
                  <Box sx={{ maxHeight: '300px', overflowY: 'auto', mb: 2, p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                    {conversation.messages
                      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                      .map((msg) => (
                        <Box key={msg.id} sx={{ mb: 1.5, pb: 1, borderBottom: msg === conversation.messages[conversation.messages.length - 1] ? 'none' : '1px solid #f0f0f0' }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <Box sx={{ 
                              flex: 1,
                              p: 1,
                              backgroundColor: msg.respondingTo ? '#bbdefb' : '#f5f5f5',
                              borderRadius: 1,
                              borderLeft: `4px solid ${msg.respondingTo ? '#1976d2' : '#999'}`
                            }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {msg.respondingTo ? '↩️ Admin Reply' : '💬 User'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {msg.content}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                  </Box>

                  {/* Reply Section - Only show if no recent admin reply */}
                  {!conversation.lastMessage.respondingTo && (
                    <Box sx={{ pt: 1, borderTop: '1px solid #e0e0e0' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedDirectMsg(conversation.userId === selectedDirectMsg ? null : conversation.userId)}
                        sx={{ mb: 1 }}
                      >
                        {selectedDirectMsg === conversation.userId ? '✓ Close' : '↩️ Reply'}
                      </Button>

                      {selectedDirectMsg === conversation.userId && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9' }}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Type your reply to this user..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            disabled={sendingReply}
                            sx={{ mb: 1 }}
                            variant="outlined"
                            size="small"
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleReplyToDirectMessage(conversation.lastMessage.id)}
                              disabled={sendingReply || !replyText.trim()}
                            >
                              {sendingReply ? '⏳ Sending...' : '✓ Send Reply'}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setSelectedDirectMsg(null)}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}

                  {conversation.lastMessage.respondingTo && (
                    <Box sx={{ mt: 1, p: 1, backgroundColor: '#c8e6c9', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        ✓ Already replied to this user
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Tab Content - Platform Stats */}
      {tabValue === 4 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Platform Statistics</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Total Users</Typography>
                <Typography variant="h3">{users.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Active Users</Typography>
                <Typography variant="h3">{users.filter(u => u.status === 'active').length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Pending Approval</Typography>
                <Typography variant="h3">{users.filter(u => u.status === 'pending_approval').length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Deactivated</Typography>
                <Typography variant="h3">{users.filter(u => u.status === 'deactivated').length}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {reportAction && `${reportAction === 'approve' ? 'Delete' : 'Keep'} Message`}
          {actionType === 'approve' && 'Activate User'}
          {actionType === 'deactivate' && 'Deactivate User'}
          {actionType === 'delete' && 'Delete User'}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ pt: 2 }}>
              <Typography>
                Are you sure you want to {reportAction === 'approve' ? 'delete this reported message' : 'keep this message'}?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Reported by: {selectedReport.reportedByName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reason: {selectedReport.reason}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                Message: "{selectedReport.messageContent.substring(0, 150)}..."
              </Typography>
            </Box>
          )}
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography>
                Are you sure you want to{' '}
                {actionType === 'approve' && 'activate'}
                {actionType === 'deactivate' && 'deactivate'}
                {actionType === 'delete' && 'delete'}
                {' '}user <strong>{selectedUser.name}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Email: {selectedUser.email}
              </Typography>
              {actionType === 'delete' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This action cannot be undone!
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={actionLoading || reportActionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={selectedReport ? confirmReportAction : confirmAction}
            variant="contained" 
            color={
              reportAction === 'approve' || actionType === 'delete' ? 'error' : 'primary'
            }
            disabled={actionLoading || reportActionLoading}
          >
            {(actionLoading || reportActionLoading) ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={openNotificationDialog} onClose={() => setOpenNotificationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Notification to All Users</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Notification Title"
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            margin="normal"
            placeholder="e.g., System Maintenance"
          />
          <TextField
            fullWidth
            label="Notification Message"
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            placeholder="Enter notification message..."
          />
          <TextField
            fullWidth
            select
            label="Type"
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
            margin="normal"
          >
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="success">Success</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </TextField>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            💡 Tip: Notifications automatically expire after 2 days
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotificationDialog(false)} disabled={sendingNotification}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendNotification}
            disabled={sendingNotification || !notificationTitle.trim() || !notificationMessage.trim()}
          >
            {sendingNotification ? 'Sending...' : 'Send Notification'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
