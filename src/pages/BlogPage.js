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
  CircularProgress
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
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { tomorrowNight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
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
    const codeToShow = codeHtml || codeCss || codeJs || '// Your code preview';
    const language = codeHtml ? 'html' : codeCss ? 'css' : 'javascript';

    return (
      <SyntaxHighlighter language={language} style={tomorrowNight}>
        {codeToShow}
      </SyntaxHighlighter>
    );
  };

  const getAllTags = () => {
    const tags = new Set();
    blogs.forEach(blog => {
      blog.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

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
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          ✓ {success}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
        <Tab label="All Blogs" />
        <Tab label="Blog Detail" disabled={!selectedBlog} />
        {user && <Tab label="My Blogs" />}
      </Tabs>

      {/* All Blogs Tab */}
      {tabValue === 0 && (
        <Box sx={{ mt: 3 }}>
          {/* ... your full All Blogs tab code with blog._id */}
        </Box>
      )}

      {/* Blog Detail Tab */}
      {tabValue === 1 && selectedBlog && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>{selectedBlog.title}</Typography>
            <ReactMarkdown>{selectedBlog.content}</ReactMarkdown>
            {/* Rest of detail view */}
          </Paper>
        </Box>
      )}

      {/* My Blogs Tab */}
      {tabValue === 2 && user && (
        <Box sx={{ mt: 3 }}>
          {/* My Blogs using myBlogs variable */}
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        {/* Your full dialog with preview upload and code preview using SyntaxHighlighter */}
      </Dialog>
    </Container>
  );
};

export default BlogPage;
