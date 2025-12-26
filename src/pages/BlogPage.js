import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  TextField,
  Paper,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Avatar,
  Divider,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CommentIcon from '@mui/icons-material/Comment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import CodeIcon from '@mui/icons-material/Code';
import ArticleIcon from '@mui/icons-material/Article';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import api from '../utils/api';
import { initSocket } from '../utils/socket';

const BlogPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
 
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [userReactions, setUserReactions] = useState({}); 
 
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [contentType, setContentType] = useState('richtext'); 
  const [preview, setPreview] = useState('');
  const [previewType, setPreviewType] = useState('');
 
  const [codeHtml, setCodeHtml] = useState('');
  const [codeCss, setCodeCss] = useState('');
  const [codeJs, setCodeJs] = useState('');
  const [codePreview, setCodePreview] = useState(false);
 
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedBlogMenu, setSelectedBlogMenu] = useState(null);

  // Fetch blogs
  useEffect(() => {
    fetchBlogs();
  }, [searchTerm, selectedTag]);

  // Set up real-time socket listeners
  useEffect(() => {
    const socket = initSocket();
   
    socket?.on('blog-reaction', (data) => {
      if (data.blogId && data.userId !== user?.id) {
        setBlogs(prev => prev.map(blog =>
          blog.id === data.blogId
            ? { ...blog, reactions: { ...blog.reactions, [data.userId]: data.reactionType } }
            : blog
        ));
      }
    });
    socket?.on('new-blog', (blogData) => {
      setBlogs(prev => [blogData, ...prev]);
    });
    socket?.on('blog-deleted', (blogId) => {
      setBlogs(prev => prev.filter(b => b.id !== blogId));
    });
    socket?.on('blog-updated', (updatedBlog) => {
      setBlogs(prev => prev.map(b => b.id === updatedBlog.id ? updatedBlog : b));
    });
    return () => {
      socket?.off('blog-reaction');
      socket?.off('new-blog');
      socket?.off('blog-deleted');
      socket?.off('blog-updated');
    };
  }, [user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBlogs();
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [searchTerm, selectedTag]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTag) params.append('tag', selectedTag);
     
      const response = await api.get(`/blog?${params}`);
      setBlogs(response.data.blogs || []);
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogDetail = async (blogId) => {
    try {
      const response = await api.get(`/blog/${blogId}`);
      setSelectedBlog(response.data.blog);
      setTabValue(1);
    } catch (err) {
      console.error('Failed to fetch blog:', err);
      setError('Failed to load blog details');
    }
  };

  // ONLY CHANGE: Base64 preview upload (no Cloudinary)
  const handlePreviewUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
      setPreviewType(file.type.startsWith('image/') ? 'image' : 'video');
      setSuccess('Preview loaded — save blog to upload');
      setTimeout(() => setSuccess(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateBlog = async () => {
    if (!blogTitle.trim() || !blogContent.trim()) {
      setError('Title and content are required');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        title: blogTitle,
        content: blogContent,
        contentType,
        tags: blogTags.split(',').map(t => t.trim()).filter(t => t),
        codeHtml: contentType === 'code' ? codeHtml : null,
        codeCss: contentType === 'code' ? codeCss : null,
        codeJs: contentType === 'code' ? codeJs : null,
        preview: preview || null,
        previewType: previewType || null
      };
      const response = await api.post('/blog', payload);
      setSuccess('Blog created successfully!');
      setOpenCreateDialog(false);
      resetForm();
      fetchBlogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create blog');
      console.error('Create blog error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBlog = async () => {
    if (!blogTitle.trim() || !blogContent.trim()) {
      setError('Title and content are required');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        title: blogTitle,
        content: blogContent,
        contentType,
        tags: blogTags.split(',').map(t => t.trim()).filter(t => t),
        codeHtml: contentType === 'code' ? codeHtml : null,
        codeCss: contentType === 'code' ? codeCss : null,
        codeJs: contentType === 'code' ? codeJs : null,
        preview: preview || null,
        previewType: previewType || null
      };
      const response = await api.put(`/blog/${editingBlog.id}`, payload);
      setSuccess('Blog updated successfully!');
      setOpenCreateDialog(false);
      setEditingBlog(null);
      fetchBlogs();
      if (selectedBlog?.id === editingBlog.id) {
        setSelectedBlog(response.data.blog);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update blog');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await api.delete(`/blog/${blogId}`);
      setSuccess('Blog deleted successfully!');
      fetchBlogs();
      if (selectedBlog?.id === blogId) {
        setSelectedBlog(null);
        setTabValue(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete blog');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedBlog) return;
    try {
      setSubmittingComment(true);
      const response = await api.post(`/blog/${selectedBlog.id}/comment`, {
        text: commentText
      });
      setSelectedBlog(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data.comment]
      }));
      setCommentText('');
      setSuccess('Comment added!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedBlog || !window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/blog/${selectedBlog.id}/comment/${commentId}`);
      setSelectedBlog(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId)
      }));
      setSuccess('Comment deleted!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleReaction = async (blogId, reactionType) => {
    if (!user) {
      setError('Please login to react to blogs');
      return;
    }
    try {
      const currentReaction = userReactions[blogId];
      const newReaction = currentReaction === reactionType ? null : reactionType;
      setUserReactions(prev => ({
        ...prev,
        [blogId]: newReaction
      }));
      const socket = initSocket();
      socket?.emit('blog-reaction', {
        blogId,
        reactionType: newReaction,
        userId: user?.id,
        userName: user?.name
      });
      const response = await api.post(`/blog/${blogId}/react`, { reactionType: newReaction });
      if (response.data.success) {
        setBlogs(prev => prev.map(b =>
          b.id === blogId ? response.data.blog : b
        ));
      }
    } catch (err) {
      setError('Failed to save reaction');
      console.error('Reaction error:', err);
    }
  };

  const handleEditBlog = (blog) => {
    setEditingBlog(blog);
    setBlogTitle(blog.title);
    setBlogContent(blog.content);
    setBlogTags(blog.tags?.join(', ') || '');
    setContentType(blog.contentType || 'richtext');
    setCodeHtml(blog.codeHtml || '');
    setCodeCss(blog.codeCss || '');
    setCodeJs(blog.codeJs || '');
    setPreview(blog.preview || '');
    setPreviewType(blog.previewType || '');
    setOpenCreateDialog(true);
    setMenuAnchor(null);
  };

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setBlogTitle('');
    setBlogContent('');
    setBlogTags('');
    setCodeHtml('');
    setCodeCss('');
    setCodeJs('');
    setContentType('richtext');
    setPreview('');
    setPreviewType('');
    setOpenCreateDialog(true);
  };

  const renderCodePreview = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; }
          ${codeCss}
        </style>
      </head>
      <body>
        ${codeHtml}
        <script>${codeJs}</script>
      </body>
      </html>
    `;
   
    return (
      <Box
        sx={{
          border: '1px solid #10d84cff',
          borderRadius: 1,
          overflow: 'hidden',
          minHeight: 400,
          mt: 2
        }}
      >
        <iframe
          srcDoc={html}
          style={{
            width: '100%',
            height: '400px',
            border: 'none'
          }}
          title="Code Preview"
        />
      </Box>
    );
  };

  const getAllTags = () => {
    const tags = new Set();
    blogs.forEach(blog => {
      blog.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  if (loading && blogs.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, animation: 'slideInDown 0.3s ease' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess('')}
          sx={{
            mb: 2,
            animation: 'slideInDown 0.3s ease',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          ✓ {success}
        </Alert>
      )}
      <style>{`
        @keyframes slideInDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
        <Tab label="All Blogs" />
        <Tab label="Blog Detail" disabled={!selectedBlog} />
        {user && <Tab label="My Blogs" />}
      </Tabs>
      {/* All Blogs Tab */}
      {tabValue === 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search blogs..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
            />
            {getAllTags().length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="All Tags"
                  onClick={() => setSelectedTag('')}
                  variant={selectedTag === '' ? 'filled' : 'outlined'}
                />
                {getAllTags().map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => setSelectedTag(tag)}
                    variant={selectedTag === tag ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            )}
            {user && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                New Blog
              </Button>
            )}
          </Box>
          {/* Your original blog list layout */}
          {/* ... (keep all your original blog card code exactly as it was) */}
          {/* All the beautiful Google-style cards, reactions, preview display, etc. */}
        </Box>
      )}
      {/* Blog Detail Tab */}
      {tabValue === 1 && selectedBlog && (
        <Box sx={{ mt: 3 }}>
          {/* Your original detail view */}
          {/* ... (keep all your original detail code) */}
        </Box>
      )}
      {/* My Blogs Tab */}
      {tabValue === 2 && user && (
        <Box sx={{ mt: 3 }}>
          {/* Your original my blogs tab */}
          {/* ... */}
        </Box>
      )}
      {/* Create/Edit Blog Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBlog ? 'Edit Blog' : 'Create New Blog'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Your original form fields */}
          {/* ... */}
          {/* Preview Upload - Base64 (only change) */}
          <Box sx={{ mt: 3, p: 2.5, backgroundColor: '#f9f9f9', borderRadius: 1.5, border: '2px dashed #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
              📸 Preview Image or Video (Like Google Search Results)
            </Typography>
            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handlePreviewUpload}
                style={{ display: 'block', marginBottom: '10px', cursor: 'pointer', padding: '8px' }}
              />
              <Typography variant="caption" color="textSecondary">
                📁 Supported: JPEG, PNG, GIF, WebP (images) or MP4, WebM (videos) — Max 10MB
              </Typography>
            </Box>
            {preview && (
              <Box sx={{ mt: 2.5, mb: 2 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
                    ✓ Preview (How it will appear in blog list):
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#e8e8e8',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid #ddd',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {previewType === 'image' ? (
                    <Box
                      component="img"
                      src={preview}
                      alt="Preview"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : previewType === 'video' ? (
                    <Box
                      component="video"
                      src={preview}
                      controls
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#000' }}
                    />
                  ) : null}
                </Box>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    setPreview('');
                    setPreviewType('');
                  }}
                  sx={{ mt: 1.5 }}
                >
                  ✕ Remove Preview
                </Button>
              </Box>
            )}
          </Box>
          {/* Rest of your original form */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={editingBlog ? handleUpdateBlog : handleCreateBlog}
            disabled={loading}
          >
            {editingBlog ? 'Update' : 'Create'} Blog
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BlogPage;
