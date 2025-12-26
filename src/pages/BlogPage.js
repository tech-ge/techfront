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

  useEffect(() => {
    fetchBlogs();
  }, [searchTerm, selectedTag]);

  useEffect(() => {
    const socket = initSocket();

    socket?.on('blog-reaction', (data) => {
      if (data.blogId && data.userId !== user?._id) {
        setBlogs(prev => prev.map(blog =>
          blog._id === data.blogId
            ? { ...blog, reactions: { ...blog.reactions, [data.userId]: data.reactionType } }
            : blog
        ));
      }
    });

    socket?.on('new-blog', (blogData) => {
      setBlogs(prev => [blogData, ...prev]);
    });

    socket?.on('blog-deleted', (blogId) => {
      setBlogs(prev => prev.filter(b => b._id !== blogId));
    });

    socket?.on('blog-updated', (updatedBlog) => {
      setBlogs(prev => prev.map(b => b._id === updatedBlog._id ? updatedBlog : b));
    });

    return () => {
      socket?.off('blog-reaction');
      socket?.off('new-blog');
      socket?.off('blog-deleted');
      socket?.off('blog-updated');
    };
  }, [user?._id]);

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handlePreviewUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large — max 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
      setPreviewType(file.type.startsWith('image/') ? 'image' : 'video');
      setSuccess('Preview loaded — save to upload');
      setTimeout(() => setSuccess(''), 3000);
    };
    reader.onerror = () => setError('Failed to read file');
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
      setBlogTitle('');
      setBlogContent('');
      setBlogTags('');
      setCodeHtml('');
      setCodeCss('');
      setCodeJs('');
      setContentType('richtext');
      setPreview('');
      setPreviewType('');
      setOpenCreateDialog(false);
      fetchBlogs();
      setTimeout(() => setSuccess(''), 3000);
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

      const response = await api.put(`/blog/${editingBlog._id}`, payload);
      setSuccess('Blog updated successfully!');
      setOpenCreateDialog(false);
      setEditingBlog(null);
      fetchBlogs();
      if (selectedBlog?._id === editingBlog._id) {
        setSelectedBlog(response.data.blog);
      }
      setTimeout(() => setSuccess(''), 3000);
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
      if (selectedBlog?._id === blogId) {
        setSelectedBlog(null);
        setTabValue(0);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete blog');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedBlog) return;
    try {
      setSubmittingComment(true);
      const response = await api.post(`/blog/${selectedBlog._id}/comment`, {
        text: commentText
      });
      setSelectedBlog(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data.comment]
      }));
      setCommentText('');
      setSuccess('Comment added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedBlog || !window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/blog/${selectedBlog._id}/comment/${commentId}`);
      setSelectedBlog(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId)
      }));
      setSuccess('Comment deleted!');
      setTimeout(() => setSuccess(''), 3000);
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
        userId: user?._id,
        userName: user?.name
      });

      const response = await api.post(`/blog/${blogId}/react`, { reactionType: newReaction });

      if (response.data.success) {
        setBlogs(prev => prev.map(b =>
          b._id === blogId ? response.data.blog : b
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

  // My Blogs filter using MongoDB _id
  const myBlogs = blogs.filter(blog => blog.author?._id === user?._id);

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

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#666' }}>
              <Box sx={{ width: 16, height: 16, border: '2px solid #ddd', borderTopColor: '#1976d2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <Typography variant="caption">Loading blogs...</Typography>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </Box>
          )}

          {blogs.length === 0 && !loading ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No blogs found</Typography>
            </Paper>
          ) : (
            <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
              {blogs.map(blog => (
                <Paper
                  key={blog._id}
                  sx={{
                    mb: 3,
                    p: 2.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      backgroundColor: '#fafafa'
                    },
                    display: 'grid',
                    gridTemplateColumns: 'calc(100% - 200px) 180px',
                    gap: 2,
                    '@media (max-width: 900px)': {
                      gridTemplateColumns: '1fr',
                    }
                  }}
                  onClick={() => fetchBlogDetail(blog._id)}
                >
                  {/* Content Section */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {blog.contentType === 'code' ? <CodeIcon fontSize="small" color="primary" /> : <ArticleIcon fontSize="small" color="primary" />}
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                        {blog.authorName}
                      </Typography>
                    </Box>
                    
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        fontWeight: 500,
                        color: '#1a0dff',
                        '&:hover': { textDecoration: 'underline' },
                        fontSize: '1.3rem',
                        lineHeight: 1.3
                      }}
                    >
                      {blog.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6,
                        fontSize: '0.95rem'
                      }}
                    >
                      {blog.content}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(blog.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary' }}>
                        <VisibilityIcon sx={{ fontSize: 14 }} /> {blog.views || 0}
                      </Typography>
                    </Box>

                    {blog.tags && blog.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {blog.tags.slice(0, 3).map(tag => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ height: '20px', fontSize: '0.75rem' }}
                          />
                        ))}
                        {blog.tags.length > 3 && (
                          <Typography variant="caption" sx={{ alignSelf: 'center', ml: 0.5 }}>
                            +{blog.tags.length - 3} more
                          </Typography>
                        )}
                      </Box>
                    )}

                    {(blog.author?._id === user?._id || isAdmin) && (
                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #eee', display: 'flex', gap: 0.5 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBlog(blog);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlog(blog._id);
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    )}

                    {/* Reaction Buttons */}
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #eee', display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(blog._id, 'like');
                        }}
                        sx={{
                          color: userReactions[blog._id] === 'like' ? '#1976d2' : '#666',
                          fontWeight: userReactions[blog._id] === 'like' ? 600 : 400,
                          '&:hover': { color: '#1976d2' }
                        }}
                        startIcon={userReactions[blog._id] === 'like' ? '👍' : '🤍'}
                      >
                        {blog.likes || 0} Like
                      </Button>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(blog._id, 'love');
                        }}
                        sx={{
                          color: userReactions[blog._id] === 'love' ? '#e91e63' : '#666',
                          fontWeight: userReactions[blog._id] === 'love' ? 600 : 400,
                          '&:hover': { color: '#e91e63' }
                        }}
                        startIcon={userReactions[blog._id] === 'love' ? '❤️' : '🤍'}
                      >
                        {blog.loves || 0} Love
                      </Button>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(blog._id, 'dislike');
                        }}
                        sx={{
                          color: userReactions[blog._id] === 'dislike' ? '#f44336' : '#666',
                          fontWeight: userReactions[blog._id] === 'dislike' ? 600 : 400,
                          '&:hover': { color: '#f44336' }
                        }}
                        startIcon={userReactions[blog._id] === 'dislike' ? '👎' : '🤍'}
                      >
                        {blog.dislikes || 0} Dislike
                      </Button>
                    </Box>
                  </Box>

                  {/* Preview Image/Video Section */}
                  <Box
                    sx={{
                      width: '180px',
                      height: '140px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      },
                      '@media (max-width: 900px)': {
                        width: '100%',
                        height: '200px',
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {blog.preview ? (
                      blog.previewType === 'image' ? (
                        <Box
                          component="img"
                          src={blog.preview}
                          alt={blog.title}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease',
                            '&:hover': { transform: 'scale(1.05)' }
                          }}
                          onClick={() => window.open(blog.preview, '_blank')}
                        />
                      ) : (
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#000'
                          }}
                        >
                          <Box
                            component="video"
                            src={blog.preview}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                            controls
                          />
                        </Box>
                      )
                    ) : (
                      <ArticleIcon sx={{ fontSize: 60, color: '#ccc' }} />
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Blog Detail Tab — your original beautiful detail view */}
      {tabValue === 1 && selectedBlog && (
        <Box sx={{ mt: 3 }}>
          {/* Add your full detail view content here */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>{selectedBlog.title}</Typography>
            <Typography variant="body1">{selectedBlog.content}</Typography>
            {/* Add the rest of your detail view JSX */}
          </Paper>
        </Box>
      )}

      {/* My Blogs Tab */}
      {tabValue === 2 && user && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ mb: 2 }}
          >
            New Blog
          </Button>

          {myBlogs.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>You haven't created any blogs yet</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {myBlogs.map(blog => (
                <Grid item xs={12} key={blog._id}>
                  <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{blog.title}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Created: {new Date(blog.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Button size="small" onClick={() => fetchBlogDetail(blog._id)}>View</Button>
                      <Button size="small" onClick={() => handleEditBlog(blog)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDeleteBlog(blog._id)}>Delete</Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Create/Edit Dialog — your original beautiful form */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingBlog ? 'Edit Blog' : 'Create New Blog'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={blogTitle}
            onChange={(e) => setBlogTitle(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Tags (comma separated)"
            value={blogTags}
            onChange={(e) => setBlogTags(e.target.value)}
            margin="normal"
            helperText="Enter tags separated by commas"
          />
          
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2">Content Type:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={contentType === 'richtext' ? 'contained' : 'outlined'}
                onClick={() => setContentType('richtext')}
              >
                Rich Text
              </Button>
              <Button
                variant={contentType === 'code' ? 'contained' : 'outlined'}
                onClick={() => setContentType('code')}
              >
                Code
              </Button>
            </Box>
          </Box>
          
          {contentType === 'richtext' ? (
            <TextField
              fullWidth
              label="Content"
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              margin="normal"
              multiline
              rows={8}
              required
            />
          ) : (
            <Box>
              <TextField
                fullWidth
                label="HTML"
                value={codeHtml}
                onChange={(e) => setCodeHtml(e.target.value)}
                margin="normal"
                multiline
                rows={4}
              />
              <TextField
                fullWidth
                label="CSS"
                value={codeCss}
                onChange={(e) => setCodeCss(e.target.value)}
                margin="normal"
                multiline
                rows={4}
              />
              <TextField
                fullWidth
                label="JavaScript"
                value={codeJs}
                onChange={(e) => setCodeJs(e.target.value)}
                margin="normal"
                multiline
                rows={4}
              />
              <Button
                onClick={() => setCodePreview(!codePreview)}
                sx={{ mt: 2 }}
              >
                {codePreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              {codePreview && renderCodePreview()}
            </Box>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Preview Image/Video (Optional, max 10MB):
            </Typography>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handlePreviewUpload}
              style={{ display: 'block', marginBottom: '10px' }}
            />
            {preview && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">Preview:</Typography>
                {previewType === 'image' ? (
                  <Box
                    component="img"
                    src={preview}
                    alt="Preview"
                    sx={{ maxWidth: '100%', maxHeight: '200px', mt: 1 }}
                  />
                ) : (
                  <Box
                    component="video"
                    src={preview}
                    controls
                    sx={{ maxWidth: '100%', maxHeight: '200px', mt: 1 }}
                  />
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={editingBlog ? handleUpdateBlog : handleCreateBlog}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : (editingBlog ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BlogPage;
