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
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  FormGroup,
  FormControlLabel,
  Autocomplete,
  Tooltip,
  Icon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SendIcon from '@mui/icons-material/Send';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
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
  
  // Enhanced Direct Messages States
  const [directMessages, setDirectMessages] = useState([]);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [messageFilter, setMessageFilter] = useState('all'); // 'all', 'unreplied', 'replied'
  
  // Mass Messaging States
  const [openMassMessageDialog, setOpenMassMessageDialog] = useState(false);
  const [massMessage, setMassMessage] = useState('');
  const [massMessageTitle, setMassMessageTitle] = useState('');
  const [selectedUsersForMass, setSelectedUsersForMass] = useState([]);
  const [selectionMode, setSelectionMode] = useState('manual'); // 'manual', 'course', 'university', 'status'
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [sendingMassMessage, setSendingMassMessage] = useState(false);
  
  // Notification states (keep existing)
  const [openNotificationDialog, setOpenNotificationDialog] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState('');

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

  // ========== ENHANCED DIRECT MESSAGES ==========
  
  const fetchDirectMessages = async () => {
    try {
      setLoadingDirect(true);
      const response = await api.get('/messages/admin/direct');
      const messages = response.data.messages || [];
      
      // Add isRead flag if not present
      const enhancedMessages = messages.map(msg => ({
        ...msg,
        isRead: msg.isRead || false
      }));
      
      setDirectMessages(enhancedMessages);
    } catch (error) {
      console.error('Failed to fetch direct messages:', error);
      setError('Failed to load direct messages');
      setDirectMessages([]);
    } finally {
      setLoadingDirect(false);
    }
  };

  // Group messages by user into conversations
  const getConversations = () => {
    const conversationsMap = {};
    
    directMessages.forEach(msg => {
      const userId = msg.sender;
      if (!conversationsMap[userId]) {
        conversationsMap[userId] = {
          userId,
          userName: msg.senderName,
          userEmail: msg.senderEmail || 'No email',
          messages: [],
          unreadCount: 0,
          lastMessage: msg,
          hasAdminReply: false
        };
      }
      
      conversationsMap[userId].messages.push(msg);
      
      // Update unread count
      if (!msg.isRead && !msg.respondingTo) {
        conversationsMap[userId].unreadCount++;
      }
      
      // Check if admin has replied
      if (msg.respondingTo) {
        conversationsMap[userId].hasAdminReply = true;
      }
      
      // Update last message
      if (new Date(msg.timestamp) > new Date(conversationsMap[userId].lastMessage.timestamp)) {
        conversationsMap[userId].lastMessage = msg;
      }
    });

    // Convert to array and sort
    const conversations = Object.values(conversationsMap);
    
    // Apply filters
    let filteredConversations = conversations;
    
    if (messageFilter === 'unreplied') {
      filteredConversations = conversations.filter(conv => !conv.hasAdminReply);
    } else if (messageFilter === 'replied') {
      filteredConversations = conversations.filter(conv => conv.hasAdminReply);
    }
    
    // Sort by: unread first, then most recent
    return filteredConversations.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    });
  };

  const markAsRead = async (userId) => {
    try {
      // Update local state immediately
      setDirectMessages(prev => prev.map(msg => 
        msg.sender === userId && !msg.isRead 
          ? { ...msg, isRead: true }
          : msg
      ));
      
      // API call to update read status
      await api.post(`/messages/admin/mark-read/${userId}`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleReplyToDirectMessage = async (conversation) => {
    if (!replyText.trim()) return;

    try {
      setSendingReply(true);
      
      // Get the last message from this user to reply to
      const lastUserMessage = conversation.messages
        .filter(msg => !msg.respondingTo)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      if (!lastUserMessage) {
        setError('No message to reply to');
        return;
      }

      const response = await api.post(`/messages/admin/direct/reply/${lastUserMessage.id}`, {
        content: replyText
      });

      if (response.data.success) {
        // Add the new reply to messages
        const newReply = response.data.message;
        setDirectMessages(prev => [...prev, newReply]);
        
        setReplyText('');
        setSelectedConversation(null);
        setNotificationSuccess('Reply sent successfully!');
        setTimeout(() => setNotificationSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      setError('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // ========== MASS MESSAGING SYSTEM ==========
  
  const handleOpenMassMessageDialog = () => {
    setOpenMassMessageDialog(true);
    setSelectedUsersForMass([]);
    setMassMessage('');
    setMassMessageTitle('');
  };

  const getCourses = () => {
    const courses = new Set();
    users.forEach(user => {
      if (user.course) courses.add(user.course);
    });
    return Array.from(courses);
  };

  const getUniversities = () => {
    const universities = new Set();
    users.forEach(user => {
      if (user.university) universities.add(user.university);
    });
    return Array.from(universities);
  };

  // Auto-select users based on criteria
  const applySelectionCriteria = () => {
    let filteredUsers = [...users];

    if (selectionMode === 'course' && selectedCourse) {
      filteredUsers = filteredUsers.filter(user => user.course === selectedCourse);
    } else if (selectionMode === 'university' && selectedUniversity) {
      filteredUsers = filteredUsers.filter(user => user.university === selectedUniversity);
    } else if (selectionMode === 'status' && selectedStatus) {
      filteredUsers = filteredUsers.filter(user => user.status === selectedStatus);
    }

    // Filter out admins if needed
    filteredUsers = filteredUsers.filter(user => user.role !== 'admin');

    setSelectedUsersForMass(filteredUsers.map(user => user.id));
  };

  // Toggle individual user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsersForMass(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all/none
  const toggleSelectAll = () => {
    if (selectedUsersForMass.length === users.filter(u => u.role !== 'admin').length) {
      setSelectedUsersForMass([]);
    } else {
      setSelectedUsersForMass(users.filter(u => u.role !== 'admin').map(u => u.id));
    }
  };

  const sendMassMessage = async () => {
    if (!massMessage.trim() || !massMessageTitle.trim() || selectedUsersForMass.length === 0) {
      setError('Please provide title, message, and select at least one user');
      return;
    }

    try {
      setSendingMassMessage(true);
      setError('');

      // Send individual messages to each selected user
      const promises = selectedUsersForMass.map(userId =>
        api.post('/messages/admin/direct', {
          userId,
          title: massMessageTitle,
          content: massMessage,
          isMassMessage: true
        })
      );

      await Promise.all(promises);
      
      setOpenMassMessageDialog(false);
      setNotificationSuccess(`Message sent to ${selectedUsersForMass.length} user(s)`);
      setTimeout(() => setNotificationSuccess(''), 3000);
      
      // Reset form
      setMassMessage('');
      setMassMessageTitle('');
      setSelectedUsersForMass([]);
    } catch (error) {
      console.error('Failed to send mass message:', error);
      setError(error.response?.data?.message || 'Failed to send messages');
    } finally {
      setSendingMassMessage(false);
    }
  };

  // ========== UI RENDERING ==========
  
  const renderDirectMessagesTab = () => {
    const conversations = getConversations();
    const selectedConv = conversations.find(c => c.userId === selectedConversation);

    return (
      <Grid container spacing={3}>
        {/* Left Panel - Conversation List */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, height: 'calc(100vh - 300px)', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Conversations</Typography>
              <Box>
                <Button
                  size="small"
                  onClick={handleOpenMassMessageDialog}
                  startIcon={<GroupAddIcon />}
                  sx={{ mr: 1 }}
                >
                  Mass Message
                </Button>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={messageFilter}
                    onChange={(e) => setMessageFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Messages</MenuItem>
                    <MenuItem value="unreplied">Unreplied</MenuItem>
                    <MenuItem value="replied">Replied</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {conversations.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                No messages yet
              </Typography>
            ) : (
              <List>
                {conversations.map((conv) => (
                  <ListItem
                    key={conv.userId}
                    button
                    selected={selectedConversation === conv.userId}
                    onClick={() => {
                      setSelectedConversation(conv.userId);
                      markAsRead(conv.userId);
                    }}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      backgroundColor: selectedConversation === conv.userId ? '#e3f2fd' : 'transparent',
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={conv.unreadCount}
                        color="error"
                        invisible={conv.unreadCount === 0}
                      >
                        <Avatar sx={{ bgcolor: conv.hasAdminReply ? '#4caf50' : '#1976d2' }}>
                          {conv.userName.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: conv.unreadCount > 0 ? 600 : 400 }}>
                            {conv.userName}
                          </Typography>
                          {conv.hasAdminReply && (
                            <Chip
                              label="Replied"
                              size="small"
                              color="success"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            {conv.lastMessage.content.substring(0, 60)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(conv.lastMessage.timestamp).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Right Panel - Conversation Detail */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, height: 'calc(100vh - 300px)', display: 'flex', flexDirection: 'column' }}>
            {selectedConv ? (
              <>
                {/* Conversation Header */}
                <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40 }}>
                      {selectedConv.userName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedConv.userName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedConv.userEmail} • {selectedConv.messages.length} messages
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={selectedConv.unreadCount > 0 ? `${selectedConv.unreadCount} unread` : 'All read'}
                      size="small"
                      color={selectedConv.unreadCount > 0 ? 'error' : 'success'}
                    />
                    <Chip
                      label={selectedConv.hasAdminReply ? 'Replied' : 'Needs reply'}
                      size="small"
                      color={selectedConv.hasAdminReply ? 'success' : 'warning'}
                    />
                  </Box>
                </Box>

                {/* Messages Thread */}
                <Box sx={{ flex: 1, overflow: 'auto', mb: 3, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                  {selectedConv.messages
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    .map((msg, index) => (
                      <Box
                        key={msg.id}
                        sx={{
                          mb: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.respondingTo ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <Paper
                          sx={{
                            p: 2,
                            maxWidth: '80%',
                            backgroundColor: msg.respondingTo ? '#e3f2fd' : 'white',
                            borderLeft: msg.respondingTo ? '4px solid #1976d2' : '4px solid #4caf50'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {msg.respondingTo ? '👤 You (Admin)' : `👤 ${selectedConv.userName}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {msg.content}
                          </Typography>
                          {msg.isMassMessage && (
                            <Chip
                              label="Mass Message"
                              size="small"
                              sx={{ mt: 1, fontSize: '0.6rem', height: 18 }}
                            />
                          )}
                        </Paper>
                      </Box>
                    ))}
                </Box>

                {/* Reply Section (only show if no recent admin reply) */}
                {!selectedConv.hasAdminReply || 
                 (selectedConv.messages.filter(m => !m.respondingTo).length > 
                  selectedConv.messages.filter(m => m.respondingTo).length) ? (
                  <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={sendingReply}
                      sx={{ mb: 2 }}
                      variant="outlined"
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => setSelectedConversation(null)}
                      >
                        Close
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handleReplyToDirectMessage(selectedConv)}
                        disabled={sendingReply || !replyText.trim()}
                        startIcon={<SendIcon />}
                      >
                        {sendingReply ? 'Sending...' : 'Send Reply'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    You've already replied to this conversation
                  </Alert>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <ChatBubbleIcon sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a conversation
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Choose a conversation from the list to view messages and reply
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // ========== MASS MESSAGE DIALOG ==========
  
  const renderMassMessageDialog = () => (
    <Dialog open={openMassMessageDialog} onClose={() => setOpenMassMessageDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupAddIcon />
          Send Mass Message
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* Left Panel - Recipient Selection */}
          <Grid item xs={12} md={4}>
            <Paper elevation={1} sx={{ p: 2, height: '400px', overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>Select Recipients</Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Selection Method</InputLabel>
                <Select
                  value={selectionMode}
                  onChange={(e) => setSelectionMode(e.target.value)}
                  label="Selection Method"
                  size="small"
                >
                  <MenuItem value="manual">Manual Selection</MenuItem>
                  <MenuItem value="course">By Course</MenuItem>
                  <MenuItem value="university">By University</MenuItem>
                  <MenuItem value="status">By Status</MenuItem>
                </Select>
              </FormControl>

              {selectionMode === 'course' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      applySelectionCriteria();
                    }}
                    label="Course"
                    size="small"
                  >
                    {getCourses().map(course => (
                      <MenuItem key={course} value={course}>{course}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {selectionMode === 'university' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>University</InputLabel>
                  <Select
                    value={selectedUniversity}
                    onChange={(e) => {
                      setSelectedUniversity(e.target.value);
                      applySelectionCriteria();
                    }}
                    label="University"
                    size="small"
                  >
                    {getUniversities().map(university => (
                      <MenuItem key={university} value={university}>{university}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {selectionMode === 'status' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      applySelectionCriteria();
                    }}
                    label="Status"
                    size="small"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="pending_approval">Pending Approval</MenuItem>
                    <MenuItem value="deactivated">Deactivated</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption">
                  {selectedUsersForMass.length} user(s) selected
                </Typography>
                {selectionMode === 'manual' && (
                  <Button size="small" onClick={toggleSelectAll}>
                    {selectedUsersForMass.length === users.filter(u => u.role !== 'admin').length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ maxHeight: '250px', overflow: 'auto' }}>
                {users
                  .filter(user => user.role !== 'admin')
                  .map(user => (
                    <FormControlLabel
                      key={user.id}
                      control={
                        <Checkbox
                          checked={selectedUsersForMass.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.course} • {user.university}
                          </Typography>
                        </Box>
                      }
                      sx={{ display: 'block', mb: 0.5 }}
                    />
                  ))}
              </Box>
            </Paper>
          </Grid>

          {/* Right Panel - Message Composition */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
              <TextField
                fullWidth
                label="Message Title"
                value={massMessageTitle}
                onChange={(e) => setMassMessageTitle(e.target.value)}
                margin="normal"
                placeholder="e.g., Important Announcement"
              />
              
              <TextField
                fullWidth
                label="Message Content"
                value={massMessage}
                onChange={(e) => setMassMessage(e.target.value)}
                margin="normal"
                multiline
                rows={8}
                placeholder="Type your message here..."
                sx={{ flex: 1 }}
              />
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  💡 This message will be sent as a direct message to each selected user.
                  You can use variables like {'{name}'} which will be replaced with the user's name.
                </Typography>
              </Alert>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenMassMessageDialog(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={sendMassMessage}
          disabled={sendingMassMessage || !massMessage.trim() || selectedUsersForMass.length === 0}
          startIcon={<SendIcon />}
        >
          {sendingMassMessage ? 'Sending...' : `Send to ${selectedUsersForMass.length} user(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ========== MAIN RENDER ==========
  
  // ... [Keep all your existing code for other tabs] ...
  // Just replace the Direct Messages tab section with the new renderDirectMessagesTab()

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ... [Keep your existing header and tabs] ... */}
      
      {/* In your Tabs section, keep everything the same but Tab 3 will use the new render */}
      
      {/* Tab Content - Direct Messages (UPDATED) */}
      {tabValue === 3 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          {renderDirectMessagesTab()}
        </Paper>
      )}
      
      {/* ... [Keep all your existing dialogs and other code] ... */}
      
      {/* Add the Mass Message Dialog */}
      {renderMassMessageDialog()}
      
    </Container>
  );
};

export default AdminDashboard;
