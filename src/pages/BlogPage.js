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
  const { user } = useAuth();

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
  const [uploadingPreview, setUploadingPreview] = useState(false);

  const [codeHtml, setCodeHtml] = useState('');
  const [codeCss, setCodeCss] = useState('');
  const [codeJs, setCodeJs] = useState('');
  const [codePreview, setCodePreview] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Fetch blogs
  useEffect(() => {
    fetchBlogs();
  }, [searchTerm, selectedTag]);

  // Real-time socket listeners
  useEffect(() => {
    const socket = initSocket();

    socket?.on('new-blog', (blogData) => {
      setBlogs(prev => [blogData, ...prev]);
    });

    socket?.on('blog-updated', (updatedBlog) => {
      setBlogs(prev => prev.map(b => b._id === updatedBlog._id ? updatedBlog : b));
      if (selectedBlog?._id === updatedBlog._id) {
        setSelectedBlog(updatedBlog);
      }
    });

    socket?.on('blog-deleted', (blogId) => {
      setBlogs(prev => prev.filter(b => b._id !== blogId));
      if (selectedBlog?._id === blogId) {
        setSelectedBlog(null);
        setTabValue(0);
      }
    });

    return () => {
      socket?.off('new-blog');
      socket?.off('blog-updated');
      socket?.off('blog-deleted');
    };
  }, [selectedBlog]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTag) params.append('tag', selectedTag);

      const response = await api.get(`/blog?${params.toString()}`);
      setBlogs(response.data.blogs || []);
    } catch (err) {
      setError('Failed to load blogs');
      console.error(err);
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
      setError('Failed to load blog');
    }
  };

  const handlePreviewUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPreview(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPreview(response.data.url);
      setPreviewType(file.type.startsWith('image/') ? 'image' : 'video');
      setSuccess('Preview uploaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploadingPreview(false);
    }
  };

  const handleCreateBlog = async () => {
    if (!blogTitle.trim() || !blogContent.trim()) {
      setError('Title and content required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: blogTitle,
        content: blogContent,
        contentType,
        tags: blogTags.split(',').map(t => t.trim()).filter(Boolean),
        codeHtml: contentType === 'code' ? codeHtml : undefined,
        codeCss: contentType === 'code' ? codeCss : undefined,
        codeJs: contentType === 'code' ? codeJs : undefined,
        preview: preview || undefined,
        previewType: previewType || undefined
      };

      const response = await api.post('/blog', payload);
      setSuccess('Blog created!');
      setOpenCreateDialog(false);
      resetForm();
      fetchBlogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBlog = async () => {
    try {
      setLoading(true);
      const payload = {
        title: blogTitle,
        content: blogContent,
        contentType,
        tags: blogTags.split(',').map(t => t.trim()).filter(Boolean),
        codeHtml: contentType === 'code' ? codeHtml : undefined,
        codeCss: contentType === 'code' ? codeCss : undefined,
        codeJs: contentType === 'code' ? codeJs : undefined,
        preview: preview || undefined,
        previewType: previewType || undefined
      };

      const response = await api.put(`/blog/${editingBlog._id}`, payload);
      setSuccess('Blog updated!');
      setOpenCreateDialog(false);
      setEditingBlog(null);
      fetchBlogs();
      if (selectedBlog?._id === editingBlog._id) {
        setSelectedBlog(response.data.blog);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update blog');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Delete this blog?')) return;
    try {
      await api.delete(`/blog/${blogId}`);
      setSuccess('Blog deleted');
      fetchBlogs();
      if (selectedBlog?._id === blogId) {
        setSelectedBlog(null);
        setTabValue(0);
      }
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const response = await api.post(`/blog/${selectedBlog._id}/comment`, { text: commentText });
      setSelectedBlog(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data.comment]
      }));
      setCommentText('');
    } catch (err) {
      setError('Failed to comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReaction = async (blogId, type) => {
    if (!user) {
      setError('Login to react');
      return;
    }
    try {
      const current = userReactions[blogId];
      const newType = current === type ? null : type;
      setUserReactions(prev => ({ ...prev, [blogId]: newType }));

      await api.post(`/blog/${blogId}/react`, { reactionType: newType });
    } catch (err) {
      setError('Reaction failed');
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
  };

  const resetForm = () => {
    setBlogTitle('');
    setBlogContent('');
    setBlogTags('');
    setCodeHtml('');
    setCodeCss('');
    setCodeJs('');
    setContentType('richtext');
    setPreview('');
    setPreviewType('');
  };

  const renderCodePreview = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><style>${codeCss}</style></head>
      <body>${codeHtml}<script>${codeJs}</script></body>
      </html>
    `;
    return (
      <iframe
        srcDoc={html}
        style={{ width: '100%', height: '400px', border: '1px solid #ddd', borderRadius: '8px' }}
        title="preview"
      />
    );
  };

  const myBlogs = blogs.filter(b => b.author?._id === user?._id);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="All Blogs" />
        <Tab label="Blog Detail" disabled={!selectedBlog} />
        {user && <Tab label={`My Blogs (${myBlogs.length})`} />}
      </Tabs>

      {/* All Blogs */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 250 }}
            />
            {user && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)}>
                New Blog
              </Button>
            )}
          </Box>

          {loading ? (
            <Box textAlign="center" py={6}><CircularProgress /></Box>
          ) : blogs.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}><Typography>No blogs yet</Typography></Paper>
          ) : (
            <Grid container spacing={3}>
              {blogs.map(blog => (
                <Grid item xs={12} md={6} lg={4} key={blog._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => fetchBlogDetail(blog._id)}>
                    {blog.preview && (
                      <Box sx={{ height: 200, overflow: 'hidden' }}>
                        {blog.previewType === 'image' ? (
                          <img src={blog.preview} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <video src={blog.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>{blog.title}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        by {blog.author?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">View</Button>
                      {(blog.author?._id === user?._id || user?.role === 'admin') && (
                        <>
                          <Button size="small" onClick={(e) => { e.stopPropagation(); handleEditBlog(blog); }}>Edit</Button>
                          <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteBlog(blog._id); }}>Delete</Button>
                        </>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Blog Detail */}
      {tabValue === 1 && selectedBlog && (
        <Box>
          {/* Detail view — same as your original */}
          {/* ... (keep your existing detail view code) */}
        </Box>
      )}

      {/* My Blogs */}
      {tabValue === 2 && user && (
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)} sx={{ mb: 3 }}>
            New Blog
          </Button>
          {/* List your blogs — similar to all blogs but filtered */}
          {myBlogs.length === 0 ? (
            <Typography>No blogs yet — create one!</Typography>
          ) : (
            <Grid container spacing={3}>
              {myBlogs.map(blog => (
                <Grid item xs={12} md={6} key={blog._id}>
                  <Card>
                    {/* Same card layout as above */}
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingBlog ? 'Edit Blog' : 'Create New Blog'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Title" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} margin="normal" />
          
          {/* Content type toggle */}
          <Box sx={{ my: 2 }}>
            <Button variant={contentType === 'richtext' ? 'contained' : 'outlined'} onClick={() => setContentType('richtext')}>
              Rich Text
            </Button>
            <Button variant={contentType === 'code' ? 'contained' : 'outlined'} onClick={() => setContentType('code')} sx={{ ml: 1 }}>
              Code
            </Button>
          </Box>

          {contentType === 'richtext' ? (
            <TextField fullWidth multiline rows={10} label="Content" value={blogContent} onChange={e => setBlogContent(e.target.value)} />
          ) : (
            <>
              <TextField fullWidth multiline rows={6} label="HTML" value={codeHtml} onChange={e => setCodeHtml(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth multiline rows={6} label="CSS" value={codeCss} onChange={e => setCodeCss(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth multiline rows={6} label="JavaScript" value={codeJs} onChange={e => setCodeJs(e.target.value)} />
            </>
          )}

          <TextField fullWidth label="Tags (comma separated)" value={blogTags} onChange={e => setBlogTags(e.target.value)} margin="normal" />

          {/* Preview Upload */}
          <Box sx={{ my: 3 }}>
            <Typography variant="subtitle2">Preview Media (Image/Video)</Typography>
            <input type="file" accept="image/*,video/*" onChange={handlePreviewUpload} disabled={uploadingPreview} />
            {uploadingPreview && <CircularProgress size={20} sx={{ ml: 1 }} />}
            {preview && (
              <Box sx={{ mt: 2, maxWidth: 400 }}>
                {previewType === 'image' ? (
                  <img src={preview} alt="preview" style={{ width: '100%', borderRadius: 8 }} />
                ) : (
                  <video src={preview} controls style={{ width: '100%', borderRadius: 8 }} />
                )}
              </Box>
            )}
          </Box>

          {contentType === 'code' && (
            <Button onClick={() => setCodePreview(!codePreview)} variant="outlined" fullWidth sx={{ mt: 2 }}>
              {codePreview ? 'Hide' : 'Show'} Code Preview
            </Button>
          )}
          {codePreview && renderCodePreview()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={editingBlog ? handleUpdateBlog : handleCreateBlog} variant="contained" disabled={loading}>
            {editingBlog ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BlogPage;
