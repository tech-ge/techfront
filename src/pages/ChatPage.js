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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReportIcon from '@mui/icons-material/Report';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import StopIcon from '@mui/icons-material/Stop';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import api from '../utils/api';
import io from 'socket.io-client';

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [shouldScroll, setShouldScroll] = useState(true);
  
  // Recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [voiceTime, setVoiceTime] = useState(0);
  const [videoTime, setVideoTime] = useState(0);
  const voiceTimerRef = useRef(null);
  const videoTimerRef = useRef(null);
  
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io('https://your-project.up.railway.app', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
      newSocket.emit('join-chat', {
        userId: user.id,
        username: user.name,
        role: user.role
      });
    });

    newSocket.on('new-message', (messageData) => {
      if (messageData && messageData.id) {
        setMessages(prev => [...prev, messageData]);
        setShouldScroll(true);
      }
    });

    newSocket.on('message-edited', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.id ? { ...msg, ...data } : msg
      ));
    });

    newSocket.on('message-deleted', (messageId) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    newSocket.on('user-typing', (userData) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== userData.userId);
        return [...filtered, userData];
      });
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.userId !== userData.userId));
      }, 3000);
    });

    newSocket.on('message-reported', (reportData) => {
      setSuccess('Message reported successfully');
      setTimeout(() => setSuccess(''), 3000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Load initial messages and filter 1-month-old messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get('/chat');
        let messages = response.data.messages || [];
        
        // Filter out messages older than 1 month
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        messages = messages.filter(msg => {
          try {
            return new Date(msg.createdAt) > oneMonthAgo;
          } catch {
            return true; // Keep messages with invalid dates
          }
        });
        
        setMessages(messages);
        setShouldScroll(true);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up auto-refresh polling (fallback if Socket.io fails)
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get('/chat');
        let newMessages = response.data.messages || [];
        
        // Filter out messages older than 1 month
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        newMessages = newMessages.filter(msg => {
          try {
            return new Date(msg.createdAt) > oneMonthAgo;
          } catch {
            return true;
          }
        });
        
        // Only update if messages changed
        if (JSON.stringify(newMessages) !== JSON.stringify(messages)) {
          setMessages(newMessages);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // Smart auto-scroll to bottom - only when user is at bottom
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShouldScroll(isAtBottom);
    }
  };

  // Auto-scroll to bottom only if user is at bottom
  useEffect(() => {
    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, shouldScroll]);

  // Cleanup recording timers on component unmount
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      setSending(true);
      const response = await api.post('/chat', {
        content: newMessage,
        type: 'text'
      });

      if (response.data && response.data.data) {
        const messageData = response.data.data;
        socket?.emit('send-message', messageData);
        setMessages(prev => [...prev, messageData]);
        setShouldScroll(true);
        setNewMessage('');
        setError('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSending(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (uploadResponse.data && uploadResponse.data.file) {
        const fileData = uploadResponse.data.file;
        
        // Send message with file
        const response = await api.post('/chat', {
          content: fileData.url,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'audio'
        });

        if (response.data && response.data.data) {
          const messageData = response.data.data;
          socket?.emit('send-message', messageData);
          setMessages(prev => [...prev, messageData]);
          setShouldScroll(true);
        }
        setUploadProgress(0);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      const response = await api.put(`/chat/${messageId}`, { content: newContent });
      const messageData = response.data.data;
      socket?.emit('edit-message', messageData);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? messageData : msg
      ));
      setEditingMessage(null);
      setError('');
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError(err.response?.data?.message || 'Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/chat/${messageId}`);
      socket?.emit('delete-message', messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setMenuAnchor(null);
      setError('');
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError(err.response?.data?.message || 'Failed to delete message');
    }
  };

  // Voice Recording
  const handleStartVoiceRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await uploadMediaFile(blob, 'audio/webm', 'voice');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setVoiceTime(0);

      // Timer for 2 minutes max
      voiceTimerRef.current = setInterval(() => {
        setVoiceTime(prev => {
          if (prev >= 119) { // 2 minutes = 120 seconds
            handleStopVoiceRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access.');
      console.error('Microphone error:', err);
    }
  };

  const handleStopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      setVoiceTime(0);
    }
  };

  // Video Recording
  const handleStartVideoRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true 
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        await uploadMediaFile(blob, 'video/webm', 'video');
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVideo(true);
      setVideoTime(0);

      // Timer for 5 minutes max
      videoTimerRef.current = setInterval(() => {
        setVideoTime(prev => {
          if (prev >= 299) { // 5 minutes = 300 seconds
            handleStopVideoRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError('Camera/Microphone access denied. Please allow camera and microphone access.');
      console.error('Camera error:', err);
    }
  };

  const handleStopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecordingVideo) {
      mediaRecorderRef.current.stop();
      setIsRecordingVideo(false);
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      setVideoTime(0);
    }
  };

  const uploadMediaFile = async (blob, mimeType, type) => {
    try {
      setSending(true);
      const formData = new FormData();
      const filename = `${type}-${Date.now()}.${mimeType.split('/')[1]}`;
      formData.append('file', blob, filename);

      const uploadResponse = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      const fileData = uploadResponse.data.file;
      const response = await api.post('/chat', {
        content: fileData.url,
        type: type
      });

      const messageData = response.data.data;
      socket?.emit('send-message', messageData);
      setMessages(prev => [...prev, messageData]);
      setUploadProgress(0);
      setSuccess(`${type === 'voice' ? 'Voice note' : 'Video'} sent!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReportMessage = async (messageId) => {
    if (!reportReason.trim()) {
      setError('Please provide a reason');
      return;
    }

    try {
      await api.post(`/chat/${messageId}/report`, { reason: reportReason });
      setOpenReportDialog(false);
      setReportingMessage(null);
      setReportReason('');
      setSuccess('Message reported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to report message:', err);
      setError(err.response?.data?.message || 'Failed to report message');
    }
  };

  const handleMenuOpen = (event, message) => {
    setSelectedMessage(message);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMessage(null);
  };

  const canEditMessage = (msg) => {
    return msg && user && (msg.sender === user.id || user.role === 'admin');
  };

  const canDeleteMessage = (msg) => {
    return msg && user && (msg.sender === user.id || user.role === 'admin');
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Handle old format URLs from before media route update
    if (url.startsWith('/uploads')) return `https://your-project.up.railway.app${url}`;
    // Handle relative paths
    return `https://your-project.up.railway.app${url}`;
  };

  const renderMessage = (msg) => {
    if (msg.type === 'image') {
      const imageUrl = getFullUrl(msg.content);
      return (
        <Box component="img" 
          src={imageUrl}
          alt="Chat image"
          sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 1, cursor: 'pointer' }}
          onClick={() => window.open(imageUrl, '_blank')}
          onError={(e) => {
            console.error('Image load failed:', imageUrl);
            e.target.style.display = 'none';
          }}
        />
      );
    } else if (msg.type === 'video') {
      const videoUrl = getFullUrl(msg.content);
      return (
        <Box component="video" 
          controls 
          width="100%"
          sx={{ maxHeight: 300, borderRadius: 1, backgroundColor: '#000' }}
          onError={(e) => {
            console.error('Video load failed:', videoUrl);
          }}
        >
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </Box>
      );
    } else if (msg.type === 'audio' || msg.type === 'voice') {
      const audioUrl = getFullUrl(msg.content);
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RecordVoiceOverIcon fontSize="small" />
          <Box component="audio" 
            controls 
            style={{ maxWidth: '250px' }}
            onError={(e) => {
              console.error('Audio load failed:', audioUrl);
            }}
          >
            <source src={audioUrl} type="audio/webm" />
            <source src={audioUrl} type="audio/mpeg" />
            <source src={audioUrl} type="audio/ogg" />
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </Box>
        </Box>
      );
    }
    return msg.content;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pb: 4 }}>
      <Paper elevation={2} sx={{ height: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column', mb: 2 }}>
        {/* Header */}
        <Box sx={{ p: 2, backgroundColor: '#1976d2', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">💬 TechG Chat</Typography>
          <Chip label={`${messages.length} messages`} color="default" size="small" />
        </Box>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ m: 1 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ m: 1 }}>{success}</Alert>}
        
        {uploadProgress > 0 && (
          <Box sx={{ p: 1 }}>
            <Typography variant="caption">Uploading... {uploadProgress}%</Typography>
          </Box>
        )}

        {/* Messages List */}
        <Box 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          sx={{ flex: 1, overflowY: 'auto', p: 2 }}
        >
          <List>
            {messages.map((msg, index) => (
              <Box key={msg.id}>
                <ListItem sx={{ mb: 2, p: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: msg.senderRole === 'admin' ? '#d32f2f' : '#1976d2' }}>
                      {msg.senderName.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <Box sx={{ flex: 1, ml: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {msg.senderName}
                        </Typography>
                        {msg.senderRole === 'admin' && (
                          <Chip label="Admin" size="small" color="error" variant="outlined" />
                        )}
                        {msg.edited && (
                          <Typography variant="caption" color="text.secondary">(edited)</Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Typography>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, msg)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Paper sx={{ p: 1.5, mt: 0.5, backgroundColor: msg.sender === user?.id ? '#e3f2fd' : '#f5f5f5' }}>
                      {renderMessage(msg)}
                    </Paper>
                  </Box>
                </ListItem>
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </List>
          {typingUsers.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {typingUsers.map(u => u.username).join(', ')} {'is typing...'}
            </Typography>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #ddd' }}>
          {uploadProgress > 0 && (
            <Box sx={{ mb: 1 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input
              hidden
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*"
            />
            <TextField
              fullWidth
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending || isRecordingVoice || isRecordingVideo}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {/* Record Voice Button */}
                    <Tooltip title={isRecordingVoice ? `Recording... ${formatTime(voiceTime)}` : "Record Voice (Max 2 min)"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={isRecordingVoice ? handleStopVoiceRecording : handleStartVoiceRecording}
                          disabled={sending || isRecordingVideo}
                          sx={{
                            color: isRecordingVoice ? '#d32f2f' : 'inherit',
                            animation: isRecordingVoice ? 'pulse 1.5s infinite' : 'none',
                            '@keyframes pulse': {
                              '0%': { opacity: 1 },
                              '50%': { opacity: 0.5 },
                              '100%': { opacity: 1 }
                            }
                          }}
                        >
                          {isRecordingVoice ? <StopIcon /> : <FiberManualRecordIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>

                    {/* Record Video Button */}
                    <Tooltip title={isRecordingVideo ? `Recording... ${formatTime(videoTime)}` : "Record Video (Max 5 min)"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={isRecordingVideo ? handleStopVideoRecording : handleStartVideoRecording}
                          disabled={sending || isRecordingVoice}
                          sx={{
                            color: isRecordingVideo ? '#d32f2f' : 'inherit',
                            animation: isRecordingVideo ? 'pulse 1.5s infinite' : 'none',
                            '@keyframes pulse': {
                              '0%': { opacity: 1 },
                              '50%': { opacity: 0.5 },
                              '100%': { opacity: 1 }
                            }
                          }}
                        >
                          {isRecordingVideo ? <StopIcon /> : <VideoLibraryIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Send Image">
                      <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={sending || isRecordingVoice || isRecordingVideo}>
                        <ImageIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send Audio File">
                      <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={sending || isRecordingVoice || isRecordingVideo}>
                        <RecordVoiceOverIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit"
              variant="contained"
              endIcon={<SendIcon />}
              disabled={sending || !newMessage.trim() || isRecordingVoice || isRecordingVideo}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Message Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        {canEditMessage(selectedMessage) && (
          <MenuItem onClick={() => {
            setEditingMessage(selectedMessage);
            setEditContent(selectedMessage?.content || '');
            handleMenuClose();
          }}>
            <EditIcon sx={{ mr: 1 }} /> Edit
          </MenuItem>
        )}
        {canDeleteMessage(selectedMessage) && (
          <MenuItem onClick={() => {
            handleDeleteMessage(selectedMessage?.id);
            handleMenuClose();
          }}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          setReportingMessage(selectedMessage);
          setOpenReportDialog(true);
          handleMenuClose();
        }}>
          <ReportIcon sx={{ mr: 1 }} /> Report
        </MenuItem>
      </Menu>

      {/* Report Dialog */}
      <Dialog open={openReportDialog} onClose={() => {
        setOpenReportDialog(false);
        setReportingMessage(null);
        setReportReason('');
      }}>
        <DialogTitle>Report Message</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            "{reportingMessage?.content.substring(0, 100)}..."
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for reporting"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Inappropriate content, spam, abuse, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenReportDialog(false);
            setReportingMessage(null);
            setReportReason('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleReportMessage(reportingMessage?.id)}
            variant="contained"
            color="error"
          >
            Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      {editingMessage && (
        <Dialog open={Boolean(editingMessage)} onClose={() => {
          setEditingMessage(null);
          setEditContent('');
        }}>
          <DialogTitle>Edit Message</DialogTitle>
          <DialogContent sx={{ minWidth: 400 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={editContent || editingMessage.content}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setEditingMessage(null);
              setEditContent('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleEditMessage(editingMessage.id, editContent || editingMessage.content);
                setEditContent('');
              }}
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default ChatPage;
