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
  Badge,
  Drawer,
  Fade,
  Zoom,
  Collapse
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
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
  const [selectedReaction, setSelectedReaction] = useState({});
  const [messageReactions, setMessageReactions] = useState({});
  
  // Admin sidebar states
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [adminCollapsed, setAdminCollapsed] = useState(false);
  const [adminMinimized, setAdminMinimized] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [unreadAdminMessages, setUnreadAdminMessages] = useState(0);
  
  // Socket and media states
  const [socket, setSocket] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Refs
  const messagesEndRef = useRef(null);
  const directMessagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // Format time like WhatsApp
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch data and setup socket
  useEffect(() => {
    fetchMessages();
    fetchDirectMessages();
    
    // Socket setup (keep your existing socket code)
    if (!user) return;

    const newSocket = io('https://techback-production.up.railway.app', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // ... your existing socket event listeners ...
    // Add unread message counter
    newSocket.on('new-direct-message', (messageData) => {
      if (messageData && messageData.id) {
        setDirectMessages(prev => [...prev, messageData]);
        if (!adminSidebarOpen || adminMinimized) {
          setUnreadAdminMessages(prev => prev + 1);
        }
      }
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user]);

  // Auto-scroll for public chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-scroll for admin chat when open
  useEffect(() => {
    if (adminSidebarOpen && !adminMinimized) {
      directMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [directMessages, adminSidebarOpen, adminMinimized]);

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

  // WhatsApp-style message bubble component
  const MessageBubble = ({ message, isOwn }) => {
    const [showTimestamp, setShowTimestamp] = useState(false);
    
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: 2,
          px: 1
        }}
      >
        {/* Other person's avatar (only for others' messages) */}
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
        
        {/* Message bubble */}
        <Box
          sx={{
            maxWidth: '70%',
            position: 'relative',
            '&:hover .message-timestamp': {
              opacity: 1
            }
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
            onMouseEnter={() => setShowTimestamp(true)}
            onMouseLeave={() => setShowTimestamp(false)}
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
            
            {/* Message content */}
            {renderMessageContent(message)}
            
            {/* Timestamp and status */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              mt: 0.5,
              gap: 0.5
            }}>
              <Typography 
                variant="caption" 
                className="message-timestamp"
                sx={{ 
                  color: isOwn ? '#128C7E' : '#666',
                  fontSize: '0.7rem',
                  opacity: showTimestamp ? 1 : 0.7,
                  transition: 'opacity 0.2s'
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
            </Box>
          </Paper>
          
          {/* Message actions (appear on hover) */}
          <Box sx={{
            position: 'absolute',
            top: -8,
            right: isOwn ? 'auto' : -30,
            left: isOwn ? -30 : 'auto',
            display: 'flex',
            gap: 0.5,
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 }
          }}>
            <Tooltip title="Reply">
              <IconButton
                size="small"
                onClick={() => setReplyingTo(message)}
                sx={{ 
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
              >
                <ReplyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {isOwn && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => deleteMessage(message.id)}
                  sx={{ 
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  // Admin message bubble (smaller, different style)
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

  // Render message content (media/files)
  const renderMessageContent = (msg) => {
    if (msg.media) {
      const isImage = msg.media.mimeType.startsWith('image/');
      const isVideo = msg.media.mimeType.startsWith('video/');
      const isAudio = msg.media.mimeType.startsWith('audio/');
      
      return (
        <Box sx={{ mb: 1 }}>
          {isImage && (
            <img 
              src={msg.media.url} 
              alt="shared" 
              style={{ 
                maxWidth: '100%', 
                borderRadius: '8px', 
                maxHeight: '200px',
                cursor: 'pointer'
              }}
              onClick={() => window.open(msg.media.url, '_blank')}
            />
          )}
          {isVideo && (
            <video 
              src={msg.media.url} 
              controls 
              style={{ 
                maxWidth: '100%', 
                borderRadius: '8px', 
                maxHeight: '200px',
                backgroundColor: '#000'
              }}
            />
          )}
          {isAudio && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AudioFileIcon fontSize="small" />
              <audio src={msg.media.url} controls style={{ flex: 1 }} />
            </Box>
          )}
          {!isImage && !isVideo && !isAudio && (
            <Button 
              size="small" 
              href={msg.media.url} 
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontSize: '0.8rem' }}
            >
              📎 {msg.media.originalName}
            </Button>
          )}
          {msg.content && (
            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.9rem' }}>
              {msg.content}
            </Typography>
          )}
        </Box>
      );
    }
    
    return (
      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
        {msg.content}
      </Typography>
    );
  };

  // Keep your existing functions (handleSendMessage, handleSendDirectMessage, etc.)
  // ... [Keep all your existing functions here, they work fine] ...

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
      
      {/* Main Chat Area (WhatsApp-style) */}
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
          
          {/* Admin Chat Toggle Button */}
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
            {/* Media buttons */}
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
            
            {/* Voice recording button */}
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

            {/* Message input */}
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
            />

            {/* Send button */}
            <Button
              type="submit"
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

      {/* Admin Chat Sidebar (Collapsible) */}
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

          {/* Admin Messages (only when not minimized) */}
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
                <div ref={directMessagesEndRef} />
              </Box>

              {/* Admin Input */}
              <Box component="form" onSubmit={handleSendDirectMessage} sx={{ 
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
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="error"
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

      {/* Admin Chat Minimized Button (when completely closed) */}
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
