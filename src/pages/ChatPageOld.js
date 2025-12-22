import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  Divider,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReportIcon from '@mui/icons-material/Report';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// Simple socket connection
let socket = null;

const ChatPage = () => {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    console.log('Initializing socket connection...');
    
    // Connect to Socket.io
    socket = new WebSocket(`ws://localhost:5002/socket.io/?EIO=4&transport=websocket`);
    
    // Try alternative: using socket.io-client
    try {
      const io = require('socket.io-client');
      socket = io('http://localhost:5002', {
        transports: ['websocket', 'polling']
      });
      
      socket.on('connect', () => {
        console.log('✅ Socket.io connected:', socket.id);
        setSocketConnected(true);
        
        // Join chat
        socket.emit('join-chat', {
          userId: user.id,
          username: user.username || user.name
        });
      });
      
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Failed to connect to chat server');
        setSocketConnected(false);
      });
      
      socket.on('new-message', (message) => {
        console.log('Received new message:', message);
        setMessages(prev => [...prev, message]);
      });
      
      socket.on('user-joined', (userData) => {
        console.log('User joined:', userData);
        const systemMessage = {
          id: Date.now(),
          type: 'system',
          content: `${userData.username} joined the chat`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, systemMessage]);
      });
      
      // Join admin room if admin
      if (isAdmin()) {
        socket.emit('join-admin-room');
      }
      
    } catch (err) {
      console.error('Failed to load socket.io:', err);
      setError('Chat feature requires socket.io connection');
    }

    // Add some sample messages for testing
    const sampleMessages = [
      {
        id: 1,
        sender: 'admin',
        senderName: 'Admin Geoffrey',
        content: 'Welcome to TechG chat! This is a test message.',
        timestamp: new Date().toISOString(),
        type: 'text',
        senderRole: 'admin'
      },
      {
        id: 2,
        sender: 'system',
        senderName: 'System',
        content: 'Real-time chat is being tested. Try sending a message!',
        timestamp: new Date().toISOString(),
        type: 'system'
      }
    ];
    
    setMessages(sampleMessages);
    setLoading(false);

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, isAdmin]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now(),
      sender: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: newMessage,
      type: 'text',
      timestamp: new Date().toISOString()
    };

    // Add to local messages immediately
    setMessages(prev => [...prev, messageData]);
    
    // Send via socket if connected
    if (socket && socketConnected) {
      socket.emit('send-message', messageData);
    } else {
      console.log('Socket not connected, message saved locally only');
    }
    
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      if (socket && socketConnected) {
        socket.emit('delete-message', messageId);
      }
    }
  };

  const handleReportMessage = (message) => {
    if (window.confirm(`Report message from ${message.senderName}?`)) {
      alert('Message reported to admin.');
      
      if (socket && socketConnected) {
        socket.emit('report-message', {
          messageId: message.id,
          reason: 'User reported this message'
        });
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSender = (messageSender) => {
    return messageSender === user.id;
  };

  if (!user) {
    return (
      <Container>
        <Alert severity="warning">
          Please login to access the chat.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4, height: 'calc(100vh - 100px)' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {!socketConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Chat server connection: {socketConnected ? 'Connected' : 'Disconnected'}
          {!socketConnected && ' - Using local chat only'}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h5" component="div">
            TechG Group Chat {socketConnected ? '✅' : '⚠️'}
          </Typography>
          <Typography variant="body2">
            Connect with Kenyan science students • {messages.length} messages
          </Typography>
        </Box>

        {/* Messages Area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <LinearProgress sx={{ width: '50%' }} />
            </Box>
          ) : (
            <List sx={{ width: '100%' }}>
              {messages.map((message) => (
                <React.Fragment key={message.id}>
                  {message.type === 'system' ? (
                    <ListItem sx={{ justifyContent: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {message.content}
                      </Typography>
                    </ListItem>
                  ) : (
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        flexDirection: isSender(message.sender) ? 'row-reverse' : 'row',
                        alignItems: 'flex-start'
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: message.senderRole === 'admin' ? 'error.main' : 'primary.main',
                            width: 32,
                            height: 32,
                            fontSize: '0.875rem'
                          }}
                        >
                          {message.senderName?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          ml: isSender(message.sender) ? 0 : 1,
                          mr: isSender(message.sender) ? 1 : 0,
                          backgroundColor: isSender(message.sender) 
                            ? 'primary.light' 
                            : message.senderRole === 'admin'
                            ? 'error.light'
                            : 'grey.100',
                          color: isSender(message.sender) || message.senderRole === 'admin' ? 'white' : 'text.primary',
                          position: 'relative'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                            {message.senderName}
                            {message.senderRole === 'admin' && (
                              <AdminPanelSettingsIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />
                            )}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {formatTime(message.timestamp)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {message.content}
                        </Typography>
                        
                        {/* Message Actions */}
                        <Box sx={{ 
                          position: 'absolute', 
                          top: -10, 
                          right: isSender(message.sender) ? 'auto' : -10,
                          left: isSender(message.sender) ? -10 : 'auto',
                          display: 'flex',
                          gap: 0.5,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          '&:hover': { opacity: 1 }
                        }}>
                          {isSender(message.sender) && (
                            <IconButton size="small" onClick={() => handleDeleteMessage(message.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                          {!isSender(message.sender) && message.type !== 'system' && (
                            <IconButton size="small" onClick={() => handleReportMessage(message)}>
                              <ReportIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Paper>
                    </ListItem>
                  )}
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>

        {/* Message Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!user}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !user}
                    color="primary"
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Press Enter to send • Chat {socketConnected ? 'connected' : 'in local mode'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ChatPage;
