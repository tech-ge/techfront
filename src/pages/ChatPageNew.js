import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Avatar,
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
  LinearProgress,
  Grid
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReplyIcon from '@mui/icons-material/Reply';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ImageIcon from '@mui/icons-material/Image';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CloseIcon from '@mui/icons-material/Close';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import StopIcon from '@mui/icons-material/Stop';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
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
  
  // Chat UI states
  const [replyingTo, setReplyingTo] = useState(null);
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState({});
  const [messageReactions, setMessageReactions] = useState({});
  
  // Direct message states
  const [adminOnline, setAdminOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  
  // Media upload states
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const directMessagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const directContainerRef = useRef(null);

  // Fetch initial messages and set up socket listeners
  useEffect(() => {
    fetchMessages();
    fetchDirectMessages();
    // No polling - all updates come via socket.io
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages');
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectMessages = async () => {
    try {
      const response = await api.get('/messages/direct/list');
      setDirectMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch direct messages:', err);
    }
  };

  // Initialize socket
  useEffect(() => {
    if (!user) return;

    const newSocket = io('https://your-project.up.railway.app', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-chat', {
        userId: user.id,
        username: user.name,
        role: user.role
      });
    });

    newSocket.on('new-message', (messageData) => {
      if (messageData && messageData.id) {
        // Avoid duplicates - only add if message doesn't already exist
        setMessages(prev => {
          const exists = prev.some(m => m.id === messageData.id);
          return exists ? prev : [...prev, messageData];
        });
      }
    });

    newSocket.on('new-direct-message', (messageData) => {
      if (messageData && messageData.id) {
        setDirectMessages(prev => [...prev, messageData]);
      }
    });

    newSocket.on('message-deleted', (deletedId) => {
      setMessages(prev => prev.filter(m => m.id !== deletedId));
    });

    newSocket.on('message-edited', (updatedMsg) => {
      setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    });

    newSocket.on('message-reaction', (data) => {
      // Update reactions from other users
      if (data.messageId && data.userId !== user.id) {
        setMessageReactions(prev => ({
          ...prev,
          [data.messageId]: data.reaction
        }));
      }
    });

    newSocket.on('message-reported', (data) => {
      // Update reported status in real-time
      if (data.messageId) {
        setMessages(prev => prev.map(m => 
          m.id === data.messageId 
            ? { ...m, reported: true } 
            : m
        ));
      }
    });

    newSocket.on('admin-online', (isOnline) => {
      setAdminOnline(isOnline);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    directMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages]);

  const handleMediaSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB max)
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

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer for recording duration
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedMedia) || !user) return;

    try {
      setSending(true);
      const payload = {
        content: newMessage,
        senderName: user.name,
        replyingTo: replyingTo?.id || null,
        mentions: extractMentions(newMessage),
        media: selectedMedia || null
      };

      // Optimistic update - add message to UI immediately
      const optimisticMessage = {
        id: Date.now().toString(),
        sender: user.id,
        senderName: user.name,
        senderRole: user.role,
        content: newMessage,
        media: selectedMedia || null,
        timestamp: new Date().toISOString(),
        edited: false,
        isDeleted: false,
        replyingTo: replyingTo?.id || null,
        mentions: extractMentions(newMessage)
      };
      setMessages(prev => [...prev, optimisticMessage]);

      const response = await api.post('/messages', payload);
      
      // Emit socket event for real-time update to other users
      socket?.emit('send-message', {
        ...response.data.data,
        userId: user.id
      });
      
      setNewMessage('');
      setSelectedMedia(null);
      setReplyingTo(null);
      setSuccess('Message sent!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleSendDirectMessage = async (e) => {
    e.preventDefault();
    if (!newDirectMessage.trim() || !user) return;

    try {
      setSending(true);
      const payload = {
        content: newDirectMessage,
        senderName: user.name
      };

      // Optimistic update
      const optimisticMsg = {
        id: Date.now().toString(),
        sender: user.id,
        senderName: user.name,
        content: newDirectMessage,
        timestamp: new Date().toISOString(),
        isRead: false,
        replyTo: null
      };
      setDirectMessages(prev => [...prev, optimisticMsg]);

      const response = await api.post('/messages/direct', payload);
      
      // Emit socket event
      socket?.emit('send-direct-message', response.data.data);
      
      setNewDirectMessage('');
      setSuccess('Message sent to admin');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      // Remove optimistic message on error
      setDirectMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const extractMentions = (text) => {
    const mentionPattern = /@(\w+)/g;
    const matches = text.match(mentionPattern);
    return matches ? matches.map(m => m.substring(1)) : [];
  };

  const handleReact = (messageId, reaction) => {
    // Optimistic update
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: reaction
    }));
    
    // Emit socket event for real-time broadcast
    socket?.emit('message-reaction', { 
      messageId, 
      reaction,
      userId: user?.id,
      userName: user?.name
    });
  };

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      
      // Remove from UI immediately
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      // Emit socket event for real-time broadcast
      socket?.emit('message-deleted', messageId);
      
      setSuccess('Message deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const reportMessage = async (messageId, reason = 'Inappropriate content') => {
    try {
      await api.post(`/messages/${messageId}/report`, { reason });
      
      // Emit socket event for real-time broadcast
      socket?.emit('message-reported', { 
        messageId,
        reason,
        reportedBy: user?.id
      });
      
      setSuccess('Message reported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to report message');
    }
  };

  const renderMessage = (msg) => {
    const isImage = msg.media?.mimeType.startsWith('image/');
    const isVideo = msg.media?.mimeType.startsWith('video/');
    const isAudio = msg.media?.mimeType.startsWith('audio/');

    return (
      <Box sx={{ maxWidth: '400px' }}>
        {msg.replyingTo && (
          <Paper
            sx={{
              p: 1,
              mb: 1,
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderLeft: '3px solid #1976d2',
              fontSize: '0.85rem'
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              ↻ Replying to someone
            </Typography>
            <Typography variant="body2">{msg.replyingTo?.content}</Typography>
          </Paper>
        )}
        
        {msg.media && (
          <Box sx={{ mb: 1 }}>
            {isImage && (
              <img 
                src={msg.media.url} 
                alt="shared" 
                style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '300px' }}
              />
            )}
            {isVideo && (
              <video 
                src={msg.media.url} 
                controls 
                style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '300px' }}
              />
            )}
            {isAudio && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AudioFileIcon />
                <audio src={msg.media.url} controls style={{ flex: 1 }} />
              </Box>
            )}
            {!isImage && !isVideo && !isAudio && (
              <Button 
                size="small" 
                href={msg.media.url} 
                target="_blank"
                rel="noopener noreferrer"
              >
                📎 {msg.media.originalName}
              </Button>
            )}
          </Box>
        )}

        {msg.content && (
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {msg.content}
          </Typography>
        )}
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
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, p: 2 }}>
      {/* Public Chat */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: { xs: '50vh', md: '100%' } }}>
        <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 2, backgroundColor: '#1976d2', color: 'white', display: 'flex', gap: 1, alignItems: 'center' }}>
            <PersonIcon />
            <Typography variant="h6" sx={{ flex: 1 }}>Public Chat</Typography>
            <Chip label={`${messages.length} messages`} color="default" size="small" />
          </Box>

          {error && <Alert severity="error" onClose={() => setError('')} sx={{ m: 1 }}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ m: 1 }}>{success}</Alert>}

          {/* Messages */}
          <Box
            ref={messagesContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="textSecondary">No messages yet. Start the conversation!</Typography>
              </Box>
            ) : (
              messages.map(msg => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.sender === user?.id ? 'flex-end' : 'flex-start',
                    gap: 1
                  }}
                >
                  {msg.sender !== user?.id && (
                    <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                      {msg.senderName.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                  <Box sx={{ maxWidth: '60%' }}>
                    {msg.sender !== user?.id && (
                      <Typography variant="caption" sx={{ fontWeight: 600, ml: 1 }}>
                        {msg.senderName}
                      </Typography>
                    )}
                    <Paper
                      sx={{
                        p: 1.5,
                        backgroundColor: msg.sender === user?.id ? '#dcf8c6' : '#fff',
                        borderRadius: '12px',
                        position: 'relative'
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (msg.sender === user?.id) {
                          deleteMessage(msg.id);
                        }
                      }}
                    >
                      {renderMessage(msg)}
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          <Tooltip title="Like">
                            <IconButton
                              size="small"
                              onClick={() => handleReact(msg.id, '👍')}
                              sx={{ p: 0, fontSize: '14px' }}
                            >
                              👍
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Love">
                            <IconButton
                              size="small"
                              onClick={() => handleReact(msg.id, '❤️')}
                              sx={{ p: 0, fontSize: '14px' }}
                            >
                              ❤️
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reply">
                            <IconButton
                              size="small"
                              onClick={() => setReplyingTo(msg)}
                              sx={{ p: 0 }}
                            >
                              <ReplyIcon sx={{ fontSize: '16px' }} />
                            </IconButton>
                          </Tooltip>
                          {msg.sender === user?.id && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => deleteMessage(msg.id)}
                                sx={{ p: 0, color: '#d32f2f' }}
                              >
                                <DeleteIcon sx={{ fontSize: '16px' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Report">
                            <IconButton
                              size="small"
                              onClick={() => reportMessage(msg.id)}
                              sx={{ p: 0, color: '#d32f2f' }}
                            >
                              🚩
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Reply Preview */}
          {replyingTo && (
            <Box sx={{ p: 1, backgroundColor: '#e3f2fd', borderLeft: '4px solid #1976d2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Replying to {replyingTo.senderName}
                </Typography>
                <Typography variant="body2">{replyingTo.content?.substring(0, 50)}...</Typography>
              </Box>
              <IconButton size="small" onClick={() => setReplyingTo(null)}>
                ✕
              </IconButton>
            </Box>
          )}

          {/* Media preview */}
          {selectedMedia && (
            <Box sx={{ p: 1, backgroundColor: '#f5f5f5', borderTop: '1px solid #eee', display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ flex: 1 }}>
                📎 {selectedMedia.originalName}
              </Typography>
              {mediaUploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ flex: 1, height: 4 }} />}
              <IconButton size="small" onClick={() => setSelectedMedia(null)} disabled={mediaUploading}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Input */}
          <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #eee' }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
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
                  color="primary"
                >
                  <ImageIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upload Audio">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaUploading || sending}
                  color="primary"
                >
                  <AudioFileIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upload Video">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaUploading || sending}
                  color="primary"
                >
                  <VideoLibraryIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={isRecording ? `Recording ${recordingTime}s` : 'Record Voice Note'}>
                <IconButton
                  size="small"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  disabled={mediaUploading || sending || mediaRecorderRef.current === null}
                  color={isRecording ? 'error' : 'primary'}
                >
                  {isRecording ? '⏹️' : '🎤'}
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending || mediaUploading}
                multiline
                maxRows={3}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={sending || mediaUploading || (!newMessage.trim() && !selectedMedia)}
                sx={{ px: 3 }}
              >
                <SendIcon />
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Direct Admin Messaging */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: { xs: '50vh', md: '100%' } }}>
        <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 2, backgroundColor: '#d32f2f', color: 'white', display: 'flex', gap: 1, alignItems: 'center' }}>
            <AdminPanelSettingsIcon />
            <Typography variant="h6" sx={{ flex: 1 }}>Admin Support</Typography>
            <Chip
              label={adminOnline ? '🟢 Online' : '🔴 Offline'}
              size="small"
              sx={{
                backgroundColor: adminOnline ? '#4caf50' : '#999',
                color: 'white'
              }}
            />
          </Box>

          {/* Messages */}
          <Box
            ref={directContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            {directMessages.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="textSecondary">No messages. Send a message for assistance!</Typography>
              </Box>
            ) : (
              directMessages.map(msg => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.sender === user?.id ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      backgroundColor: msg.sender === user?.id ? '#dcf8c6' : '#fff',
                      borderRadius: '12px'
                    }}
                  >
                    {msg.sender !== user?.id && (
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Admin
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {msg.content}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </Box>
              ))
            )}
            <div ref={directMessagesEndRef} />
          </Box>

          {/* Input */}
          <Box component="form" onSubmit={handleSendDirectMessage} sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Ask for help..."
              value={newDirectMessage}
              onChange={(e) => setNewDirectMessage(e.target.value)}
              disabled={sending}
              multiline
              maxRows={3}
            />
            <Button
              type="submit"
              variant="contained"
              color="error"
              disabled={sending || !newDirectMessage.trim()}
              sx={{ px: 3 }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ChatPageNew;
