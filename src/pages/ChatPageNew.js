import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Avatar,
  Alert,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Badge,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReportIcon from '@mui/icons-material/Report';
import ReplyIcon from '@mui/icons-material/Reply';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ImageIcon from '@mui/icons-material/Image';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import CloseIcon from '@mui/icons-material/Close';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import StopIcon from '@mui/icons-material/Stop';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import api from '../utils/api';
import io from 'socket.io-client';

const ChatPageNew = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newDirectMessage, setNewDirectMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // WhatsApp-style UI states
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  // Admin sidebar states
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [adminMinimized, setAdminMinimized] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [unreadAdminMessages, setUnreadAdminMessages] = useState(0);
  
  // Message actions states
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reactions, setReactions] = useState({}); // { messageId: { 'like': [userIds], 'love': [userIds] } }
  
  // Socket and media states
  const [socket, setSocket] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Refs
  const messagesEndRef = useRef(null);
  const directContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // ========== INITIAL DATA FETCH ==========
  useEffect(() => {
    fetchMessages();
    fetchDirectMessages();
  }, []);

  // Fetch messages from YOUR chat endpoint
  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('Fetching messages from /chat endpoint...');
      
      // Use your actual chat endpoint
      const response = await api.get('/chat');
      console.log('Messages response:', response.data);
      
      if (response.data.success) {
        const fetchedMessages = response.data.messages || response.data.data || [];
        console.log(`Loaded ${fetchedMessages.length} messages`);
        setMessages(fetchedMessages);
      } else {
        // Fallback: Create sample messages for testing
        console.log('No messages returned, creating sample messages');
        const sampleMessages = [
          {
            id: '1',
            sender: 'admin',
            senderName: 'Admin Geoffrey',
            senderRole: 'admin',
            content: 'Welcome to TechG chat! Feel free to ask questions.',
            timestamp: new Date().toISOString(),
            type: 'text',
            edited: false
          },
          {
            id: '2',
            sender: 'system',
            senderName: 'System',
            content: 'Chat is active. You can send messages, images, and voice notes.',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            type: 'text',
            edited: false
          }
        ];
        setMessages(sampleMessages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages. Please refresh.');
      
      // Even on error, show sample messages so UI works
      const sampleMessages = [
        {
          id: '1',
          sender: 'admin',
          senderName: 'Admin',
          senderRole: 'admin',
          content: 'Welcome to TechG!',
          timestamp: new Date().toISOString(),
          type: 'text',
          edited: false
        }
      ];
      setMessages(sampleMessages);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectMessages = async () => {
    try {
      // Try to fetch from your direct messages endpoint
      const response = await api.get('/messages/direct/list');
      if (response.data.messages) {
        setDirectMessages(response.data.messages);
      }
    } catch (err) {
      console.log('Direct messages endpoint not available, using empty array');
      setDirectMessages([]);
    }
  };

  // ========== SOCKET.IO SETUP ==========
  useEffect(() => {
    if (!user) return;

    const newSocket = io('https://techback-production.up.railway.app', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to socket server');
      newSocket.emit('join-chat', {
        userId: user.id,
        username: user.name,
        role: user.role
      });
    });

    newSocket.on('new-message', (messageData) => {
      console.log('New message received:', messageData);
      if (messageData && messageData.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === messageData.id);
          return exists ? prev : [...prev, messageData];
        });
      }
    });

    newSocket.on('new-direct-message', (messageData) => {
      if (messageData && messageData.id) {
        setDirectMessages(prev => [...prev, messageData]);
        if (!adminSidebarOpen || adminMinimized) {
          setUnreadAdminMessages(prev => prev + 1);
        }
      }
    });

    newSocket.on('message-deleted', (deletedId) => {
      setMessages(prev => prev.filter(m => m.id !== deletedId));
    });

    newSocket.on('message-edited', (updatedMsg) => {
      setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    });

    newSocket.on('message-reaction', (data) => {
      if (data.messageId) {
        setReactions(prev => ({
          ...prev,
          [data.messageId]: {
            ...prev[data.messageId],
            [data.reaction]: [...(prev[data.messageId]?.[data.reaction] || []), data.userId]
          }
        }));
      }
    });

    newSocket.on('message-reported', (data) => {
      console.log('Message reported:', data);
      setSuccess('Message reported to admin');
      setTimeout(() => setSuccess(''), 3000);
    });

    newSocket.on('admin-online', (isOnline) => {
      setAdminOnline(isOnline);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, adminSidebarOpen, adminMinimized]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (adminSidebarOpen && !adminMinimized && directContainerRef.current) {
      directContainerRef.current.scrollTop = directContainerRef.current.scrollHeight;
    }
  }, [directMessages, adminSidebarOpen, adminMinimized]);

  // ========== MESSAGE ACTIONS ==========

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !selectedMedia) || !user) return;

    try {
      setSending(true);
      
      // First upload media if exists
      let mediaData = null;
      if (selectedMedia) {
        mediaData = selectedMedia;
      }

      const payload = {
        content: newMessage,
        type: 'text',
        ...(mediaData && { media: mediaData }),
        ...(replyingTo && { replyingTo: replyingTo.id })
      };

      console.log('Sending message payload:', payload);

      // Optimistic update
      const optimisticMessage = {
        id: Date.now().toString(),
        sender: user.id,
        senderName: user.name || user.username,
        senderRole: user.role,
        content: newMessage,
        media: mediaData || null,
        timestamp: new Date().toISOString(),
        edited: false,
        replyingTo: replyingTo?.id || null,
        type: 'text'
      };
      
      setMessages(prev => [...prev, optimisticMessage]);

      // Send to backend
      const response = await api.post('/chat', payload);
      console.log('Message sent response:', response.data);

      if (response.data.success) {
        // Replace optimistic message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? response.data.data : msg
        ));
        
        // Emit socket event
        socket?.emit('send-message', response.data.data);
        
        setNewMessage('');
        setSelectedMedia(null);
        setReplyingTo(null);
        setSuccess('Message sent!');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage?.id));
    } finally {
      setSending(false);
    }
  };

  // Send direct message to admin
  const handleSendDirectMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newDirectMessage.trim() || !user) return;

    try {
      setSending(true);
      const payload = {
        content: newDirectMessage,
        senderName: user.name
      };

      const response = await api.post('/messages/direct', payload);
      
      if (response.data.success) {
        const newMsg = response.data.data;
        setDirectMessages(prev => [...prev, newMsg]);
        socket?.emit('send-direct-message', newMsg);
        setNewDirectMessage('');
        setSuccess('Message sent to admin');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to send direct message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Edit message
  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      const response = await api.put(`/chat/${editingMessage.id}`, { 
        content: editContent 
      });
      
      if (response.data.success) {
        const updatedMsg = response.data.data;
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id ? updatedMsg : msg
        ));
        socket?.emit('edit-message', updatedMsg);
        setEditingMessage(null);
        setEditContent('');
        setSuccess('Message edited');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError('Failed to edit message');
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/chat/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      socket?.emit('delete-message', messageId);
      setMenuAnchor(null);
      setSuccess('Message deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError('Failed to delete message');
    }
  };

  // Report message
  const handleReportMessage = async () => {
    if (!selectedMessage || !reportReason.trim()) return;

    try {
      await api.post(`/chat/${selectedMessage.id}/report`, { 
        reason: reportReason 
      });
      
      socket?.emit('report-message', {
        messageId: selectedMessage.id,
        reason: reportReason,
        reportedBy: user.id
      });
      
      setReportDialogOpen(false);
      setReportReason('');
      setSelectedMessage(null);
      setMenuAnchor(null);
      setSuccess('Message reported to admin');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to report message:', err);
      setError('Failed to report message');
    }
  };

  // React to message
  const handleReact = (messageId, reaction) => {
    // Optimistic update
    setReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [reaction]: [...(prev[messageId]?.[reaction] || []), user.id]
      }
    }));

    // Emit socket event
    socket?.emit('message-reaction', {
      messageId,
      reaction,
      userId: user.id,
      userName: user.name
    });
  };

  // Media handling
  const handleMediaSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setMediaUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        setSelectedMedia(response.data.file);
        setUploadProgress(0);
        setSuccess('Media uploaded! Now send message or add text.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setMediaUploading(false);
      setUploadProgress(0);
    }
  };

  // Voice recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, `voice-note-${Date.now()}.webm`);

          const response = await api.post('/chat/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (response.data.success) {
            setSelectedMedia(response.data.file);
            setSuccess('Voice note recorded! Ready to send.');
            setTimeout(() => setSuccess(''), 2000);
          }
        } catch (err) {
          setError('Failed to upload voice note');
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  // ========== UI COMPONENTS ==========

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (msg) => {
    if (msg.type === 'image' || (msg.media && msg.media.mimeType?.startsWith('image/'))) {
      const imageUrl = msg.content || msg.media?.url;
      return (
        <Box sx={{ mb: 1 }}>
          <img 
            src={imageUrl} 
            alt="shared" 
            style={{ 
              maxWidth: '100%', 
              borderRadius: '8px', 
              maxHeight: '200px',
              cursor: 'pointer'
            }}
            onClick={() => window.open(imageUrl, '_blank')}
          />
          {msg.content && msg.type === 'text' && (
            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.9rem' }}>
              {msg.content}
            </Typography>
          )}
        </Box>
      );
    }
    
    if (msg.type === 'audio' || msg.type === 'voice' || 
        (msg.media && msg.media.mimeType?.startsWith('audio/'))) {
      const audioUrl = msg.content || msg.media?.url;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AudioFileIcon fontSize="small" />
          <audio src={audioUrl} controls style={{ flex: 1 }} />
        </Box>
      );
    }
    
    return (
      <Typography variant="body2" sx={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>
        {msg.content}
      </Typography>
    );
  };

  // WhatsApp Message Bubble Component
  const MessageBubble = ({ message, isOwn }) => {
    const messageReactions = reactions[message.id] || {};
    const hasReactions = Object.keys(messageReactions).length > 0;

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: 2,
          px: 1
        }}
      >
        {!isOwn && (
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              mr: 1,
              alignSelf: 'flex-end',
              bgcolor: message.senderRole === 'admin' ? '#d32f2f' : '#1976d2'
            }}
          >
            {message.senderName?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
        )}
        
        <Box
          sx={{
            maxWidth: '70%',
            position: 'relative'
          }}
        >
          {!isOwn && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                ml: 1, 
                mb: 0.5,
                color: '#666',
                fontSize: '0.75rem'
              }}
            >
              {message.senderName}
              {message.senderRole === 'admin' && ' • Admin'}
            </Typography>
          )}
          
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              backgroundColor: isOwn ? '#DCF8C6' : '#FFFFFF',
              borderRadius: isOwn 
                ? '18px 4px 18px 18px' 
                : '4px 18px 18px 18px',
              border: isOwn ? 'none' : '1px solid #E0E0E0',
              position: 'relative',
              '&:hover': {
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
              }
            }}
          >
            {/* Reply indicator */}
            {message.replyingTo && (
              <Box sx={{
                p: 1,
                mb: 1,
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderLeft: '3px solid #128C7E',
                borderRadius: '8px 0 0 8px',
                fontSize: '0.85rem'
              }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#128C7E' }}>
                  ↻ Reply
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  {message.replyingTo?.content?.substring(0, 50)}...
                </Typography>
              </Box>
            )}
            
            {renderMessageContent(message)}
            
            {/* Reactions */}
            {hasReactions && (
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5, 
                mt: 0.5,
                flexWrap: 'wrap'
              }}>
                {Object.entries(messageReactions).map(([reaction, users]) => (
                  <Chip
                    key={reaction}
                    size="small"
                    label={`${reaction === 'like' ? '👍' : '❤️'} ${users.length}`}
                    sx={{ height: '20px', fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            )}
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mt: 0.5
            }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {/* Reaction buttons */}
                <Tooltip title="Like">
                  <IconButton
                    size="small"
                    onClick={() => handleReact(message.id, 'like')}
                    sx={{ p: 0, fontSize: '14px', minWidth: '24px' }}
                  >
                    👍
                  </IconButton>
                </Tooltip>
                <Tooltip title="Love">
                  <IconButton
                    size="small"
                    onClick={() => handleReact(message.id, 'love')}
                    sx={{ p: 0, fontSize: '14px', minWidth: '24px' }}
                  >
                    ❤️
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reply">
                  <IconButton
                    size="small"
                    onClick={() => setReplyingTo(message)}
                    sx={{ p: 0, fontSize: '14px' }}
                  >
                    <ReplyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: isOwn ? '#128C7E' : '#666',
                    fontSize: '0.7rem'
                  }}
                >
                  {formatTimestamp(message.timestamp)}
                </Typography>
                
                {isOwn && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#128C7E',
                      fontSize: '0.7rem'
                    }}
                  >
                    ✓✓
                  </Typography>
                )}
                
                {message.edited && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#666',
                      fontSize: '0.7rem',
                      fontStyle: 'italic'
                    }}
                  >
                    Edited
                  </Typography>
                )}
                
                {/* More options menu */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    setSelectedMessage(message);
                    setMenuAnchor(e.currentTarget);
                  }}
                  sx={{ p: 0 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  };

  // Admin message bubble
  const AdminMessageBubble = ({ message }) => {
    const isOwn = message.sender === user?.id;
    
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: 1.5,
          px: 0.5
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1,
            backgroundColor: isOwn ? '#DCF8C6' : '#FFFFFF',
            borderRadius: isOwn 
              ? '12px 4px 12px 12px' 
              : '4px 12px 12px 12px',
            border: isOwn ? 'none' : '1px solid #E0E0E0',
            maxWidth: '85%'
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
            {message.content}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'right',
              color: '#666',
              fontSize: '0.65rem',
              mt: 0.5
            }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>
        </Paper>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 100px)', 
      display: 'flex',
      position: 'relative',
      backgroundColor: '#E5DDD5',
      backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
      backgroundRepeat: 'repeat',
      overflow: 'hidden'
    }}>
      
      {/* Main Chat Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        position: 'relative'
      }}>
        {/* Chat Header */}
        <Paper elevation={0} sx={{ 
          backgroundColor: '#075E54',
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 0,
          zIndex: 10
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#128C7E', width: 40, height: 40 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                TechG Public Chat
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                {messages.length} messages • {adminOnline ? '🟢 Online' : '🔴 Offline'}
              </Typography>
            </Box>
          </Box>
          
          <Tooltip title={adminSidebarOpen ? "Hide Admin Chat" : "Show Admin Chat"}>
            <Badge 
              badgeContent={unreadAdminMessages} 
              color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
            >
              <IconButton 
                onClick={() => {
                  setAdminSidebarOpen(!adminSidebarOpen);
                  if (unreadAdminMessages > 0 && adminSidebarOpen) {
                    setUnreadAdminMessages(0);
                  }
                }}
                sx={{ color: 'white' }}
              >
                <AdminPanelSettingsIcon />
              </IconButton>
            </Badge>
          </Tooltip>
        </Paper>

        {/* Error/Success Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ m: 1 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ m: 1 }}>
            {success}
          </Alert>
        )}

        {/* Messages Container */}
        <Box
          ref={messagesContainerRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
            backgroundRepeat: 'repeat',
            backgroundSize: 'contain'
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              flexDirection: 'column',
              gap: 2
            }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 60, color: '#128C7E', opacity: 0.5 }} />
              <Typography color="textSecondary" sx={{ fontSize: '1rem' }}>
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            messages.map(msg => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.sender === user?.id}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Reply Preview */}
        {replyingTo && (
          <Box sx={{ 
            p: 1, 
            backgroundColor: '#f0f0f0', 
            borderTop: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#128C7E' }}>
                Replying to {replyingTo.senderName}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                {replyingTo.content?.substring(0, 60)}...
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setReplyingTo(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Message Input Area */}
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          borderTop: '1px solid #ddd',
          backgroundColor: '#F0F0F0',
          borderRadius: 0
        }}>
          {selectedMedia && (
            <Box sx={{ 
              mb: 1, 
              p: 1, 
              backgroundColor: 'white', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography variant="caption" sx={{ flex: 1 }}>
                📎 {selectedMedia.originalName}
              </Typography>
              {mediaUploading && (
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ flex: 1, height: 4 }} 
                />
              )}
              <IconButton 
                size="small" 
                onClick={() => setSelectedMedia(null)} 
                disabled={mediaUploading}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaSelect}
              accept="image/*,audio/*,video/*"
              style={{ display: 'none' }}
            />
            <Tooltip title="Upload Image">
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaUploading || sending}
              >
                <ImageIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isRecording ? `Recording ${recordingTime}s` : 'Record Voice Note'}>
              <IconButton
                size="small"
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                disabled={mediaUploading || sending}
                sx={{ 
                  color: isRecording ? '#d32f2f' : 'inherit',
                  animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 }
                  }
                }}
              >
                {isRecording ? <StopIcon /> : <RecordVoiceOverIcon />}
              </IconButton>
            </Tooltip>

            <TextField
              size="small"
              fullWidth
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending || mediaUploading}
              multiline
              maxRows={3}
              sx={{
                backgroundColor: 'white',
                borderRadius: '20px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  paddingRight: '12px'
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={sending || mediaUploading || (!newMessage.trim() && !selectedMedia)}
              sx={{
                minWidth: 'auto',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#128C7E',
                '&:hover': {
                  backgroundColor: '#075E54'
                }
              }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {selectedMessage && selectedMessage.sender === user?.id && (
          <MenuItem onClick={() => {
            setEditingMessage(selectedMessage);
            setEditContent(selectedMessage.content || '');
            setMenuAnchor(null);
          }}>
            <EditIcon sx={{ mr: 1, fontSize: 'small' }} /> Edit
          </MenuItem>
        )}
        
        {selectedMessage && selectedMessage.sender === user?.id && (
          <MenuItem onClick={() => {
            deleteMessage(selectedMessage.id);
            setMenuAnchor(null);
          }}>
            <DeleteIcon sx={{ mr: 1, fontSize: 'small' }} /> Delete
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          setReportDialogOpen(true);
          setMenuAnchor(null);
        }}>
          <ReportIcon sx={{ mr: 1, fontSize: 'small' }} /> Report
        </MenuItem>
      </Menu>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)}>
        <DialogTitle>Report Message</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Report message from {selectedMessage?.senderName}?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for reporting"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Inappropriate content, spam, harassment, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setReportDialogOpen(false);
            setReportReason('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleReportMessage}
            variant="contained"
            color="error"
          >
            Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={Boolean(editingMessage)} onClose={() => setEditingMessage(null)}>
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
            sx={{ mt: 1, minWidth: '300px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingMessage(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleEditMessage}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Chat Sidebar */}
      <Collapse 
        in={adminSidebarOpen} 
        orientation="horizontal"
        sx={{ 
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          height: '100%'
        }}
      >
        <Paper elevation={3} sx={{ 
          height: '100%', 
          width: adminMinimized ? '60px' : '350px',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s',
          borderRadius: '12px 0 0 12px',
          overflow: 'hidden'
        }}>
          
          {/* Admin Header */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#d32f2f', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '64px'
          }}>
            {!adminMinimized ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AdminPanelSettingsIcon />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Admin Support
                    </Typography>
                    <Typography variant="caption">
                      {adminOnline ? '🟢 Online • Ready to help' : '🔴 Offline • Will reply soon'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Minimize">
                    <IconButton 
                      size="small" 
                      onClick={() => setAdminMinimized(true)}
                      sx={{ color: 'white' }}
                    >
                      <KeyboardArrowDownIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Close">
                    <IconButton 
                      size="small" 
                      onClick={() => setAdminSidebarOpen(false)}
                      sx={{ color: 'white' }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                width: '100%'
              }}>
                <Badge 
                  badgeContent={unreadAdminMessages} 
                  color="error"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                >
                  <AdminPanelSettingsIcon />
                </Badge>
                <Tooltip title="Expand Admin Chat" placement="right">
                  <IconButton 
                    size="small" 
                    onClick={() => setAdminMinimized(false)}
                    sx={{ color: 'white', mt: 1 }}
                  >
                    <KeyboardArrowUpIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Admin Messages */}
          {!adminMinimized && (
            <>
              <Box
                ref={directContainerRef}
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {directMessages.length === 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    flexDirection: 'column',
                    gap: 1,
                    textAlign: 'center'
                  }}>
                    <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: '#d32f2f', opacity: 0.5 }} />
                    <Typography color="textSecondary" sx={{ fontSize: '0.9rem' }}>
                      No messages yet. Ask for help!
                    </Typography>
                  </Box>
                ) : (
                  directMessages.map(msg => (
                    <AdminMessageBubble key={msg.id} message={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Admin Input */}
              <Box sx={{ 
                p: 1.5, 
                borderTop: '1px solid #ddd',
                backgroundColor: 'white'
              }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Ask for help..."
                    value={newDirectMessage}
                    onChange={(e) => setNewDirectMessage(e.target.value)}
                    disabled={sending}
                    multiline
                    maxRows={2}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '20px'
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendDirectMessage();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleSendDirectMessage}
                    disabled={sending || !newDirectMessage.trim()}
                    sx={{
                      minWidth: 'auto',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%'
                    }}
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Collapse>

      {/* Admin Chat Minimized Button */}
      {!adminSidebarOpen && (
        <Tooltip title="Admin Support" placement="left">
          <Badge 
            badgeContent={unreadAdminMessages} 
            color="error"
            sx={{ 
              position: 'absolute',
              right: 16,
              bottom: 16,
              zIndex: 100,
              '& .MuiBadge-badge': { fontSize: '0.7rem' }
            }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                setAdminSidebarOpen(true);
                setAdminMinimized(false);
                if (unreadAdminMessages > 0) {
                  setUnreadAdminMessages(0);
                }
              }}
              sx={{
                minWidth: 'auto',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                boxShadow: 3
              }}
            >
              <AdminPanelSettingsIcon />
            </Button>
          </Badge>
        </Tooltip>
      )}
    </Box>
  );
};

export default ChatPageNew;
