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
  Pagination,
  Menu,
  MenuItem,
  InputAdornment,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel
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
import ShareIcon from '@mui/icons-material/Share';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import api from '../utils/api';
import { initSocket } from '../utils/socket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const BlogPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // State variables
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [userReactions, setUserReactions] = useState({});

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalBlogs, setTotalBlogs] = useState(0);

  // Categories
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Blog creation/editing
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [contentType, setContentType] = useState('richtext');
  const [preview, setPreview] = useState('');
  const [previewType, setPreviewType] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [markdownMode, setMarkdownMode] = useState(false);

  // Code editor
  const [codeHtml, setCodeHtml] = useState('');
  const [codeCss, setCodeCss] = useState('');
  const [codeJs, setCodeJs] = useState('');
  const [codePreview, setCodePreview] = useState(false);

  // Comments
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Markdown toolbar
  const [markdownToolbar, setMarkdownToolbar] = useState({
    bold: false,
    italic: false,
    list: false,
    orderedList: false,
    quote: false
  });

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [shareMenuAnchor, setShareMenuAnchor] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showOnlyMyBlogs, setShowOnlyMyBlogs] = useState(false);
  const [imageOptimization, setImageOptimization] = useState(true);

  // Database schema references (comments for your backend)
  /*
  BLOG SCHEMA:
  {
    _id: ObjectId,
    title: String,
    content: String,
    contentType: String, // 'richtext', 'code', 'markdown'
    tags: [String],
    category: String,
    author: { _id: ObjectId, name: String, email: String },
    preview: String, // base64 or URL
    previewType: String, // 'image', 'video'
    isDraft: Boolean,
    views: Number,
    likes: Number,
    loves: Number,
    dislikes: Number,
    reactions: Map<String, String>, // userId -> reactionType
    comments: [Comment],
    status: String, // 'published', 'draft'
    createdAt: Date,
    updatedAt: Date,
    featured: Boolean,
    readingTime: Number // in minutes
  }

  COMMENT SCHEMA:
  {
    _id: ObjectId,
    text: String,
    author: { _id: ObjectId, name: String },
    blogId: ObjectId,
    createdAt: Date
  }

  CATEGORY SCHEMA:
  {
    _id: ObjectId,
    name: String,
    slug: String,
    description: String,
    createdAt: Date
  }
  */

  // Fetch blogs with pagination
  useEffect(() => {
    fetchBlogs();
  }, [searchTerm, selectedTag, selectedCategory, page, pageSize, sortBy, showOnlyMyBlogs]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Socket setup
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
      setTotalBlogs(prev => prev + 1);
    });

    socket?.on('blog-deleted', (blogId) => {
      setBlogs(prev => prev.filter(b => b._id !== blogId));
      setTotalBlogs(prev => prev - 1);
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

  // Auto-refresh every 3 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBlogs();
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [searchTerm, selectedTag, selectedCategory, page, pageSize, sortBy, showOnlyMyBlogs]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTag) params.append('tag', selectedTag);
      if (selectedCategory) params.append('category', selectedCategory);
      if (page) params.append('page', page);
      if (pageSize) params.append('limit', pageSize);
      if (sortBy) params.append('sort', sortBy);
      if (showOnlyMyBlogs && user) params.append('authorId', user._id);

      const response = await api.get(`/blog?${params}`);
      setBlogs(response.data.blogs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalBlogs(response.data.total || 0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/blog/categories');
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchBlogDetail = async (blogId) => {
    try {
      const response = await api.get(`/blog/${blogId}`);
      setSelectedBlog(response.data.blog);
      setTabValue(1);
      
      // Increment view count
      await api.post(`/blog/${blogId}/view`);
    } catch (err) {
      console.error('Failed to fetch blog:', err);
      setError('Failed to load blog details');
    }
  };

  // Image optimization function (client-side resizing)
  const optimizeImage = async (file) => {
    if (!imageOptimization) return file;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1200px width, maintain aspect ratio)
          const maxWidth = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP format for better compression
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/webp' }));
          }, 'image/webp', 0.8); // 80% quality
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePreviewUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large — max 10MB');
      return;
    }

    try {
      setLoading(true);
      let processedFile = file;
      
      // Optimize image if enabled
      if (file.type.startsWith('image/') && imageOptimization) {
        processedFile = await optimizeImage(file);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
        setPreviewType(processedFile.type.startsWith('image/') ? 'image' : 'video');
        setSuccess('Preview loaded — save to upload');
        setTimeout(() => setSuccess(''), 3000);
        setLoading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      setError('Failed to process image');
      setLoading(false);
    }
  };

  const handleCreateBlog = async () => {
    if (!blogTitle.trim()) {
      setError('Title is required');
      return;
    }

    if (contentType !== 'code' && !blogContent.trim()) {
      setError('Content is required');
      return;
    }

    if (contentType === 'code' && !codeHtml.trim() && !codeCss.trim() && !codeJs.trim()) {
      setError('At least one code field (HTML, CSS, or JS) is required');
      return;
    }

    try {
      setLoading(true);
      
      // Calculate reading time (approx 200 words per minute)
      const wordCount = blogContent.trim().split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);
      
      const payload = {
        title: blogTitle,
        content: contentType === 'code' ? JSON.stringify({ html: codeHtml, css: codeCss, js: codeJs }) : blogContent,
        contentType: contentType === 'code' ? 'code' : (markdownMode ? 'markdown' : 'richtext'),
        tags: blogTags.split(',').map(t => t.trim()).filter(t => t),
        category: blogCategory,
        preview: preview || null,
        previewType: previewType || null,
        isDraft: saveAsDraft,
        status: saveAsDraft ? 'draft' : 'published',
        readingTime,
        featured: false
      };

      const response = await api.post('/blog', payload);
      setSuccess(saveAsDraft ? 'Blog saved as draft!' : 'Blog published successfully!');
      
      // Reset form
      setBlogTitle('');
      setBlogContent('');
      setBlogTags('');
      setBlogCategory('');
      setCodeHtml('');
      setCodeCss('');
      setCodeJs('');
      setContentType('richtext');
      setPreview('');
      setPreviewType('');
      setSaveAsDraft(false);
      setIsDraft(false);
      setOpenCreateDialog(false);
      
      // Refresh blogs
      fetchBlogs();
      
      // Navigate to the new blog if published
      if (!saveAsDraft) {
        fetchBlogDetail(response.data.blog._id);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create blog');
      console.error('Create blog error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBlog = async () => {
    if (!blogTitle.trim()) {
      setError('Title is required');
      return;
    }

    if (contentType !== 'code' && !blogContent.trim()) {
      setError('Content is required');
      return;
    }

    if (contentType === 'code' && !codeHtml.trim() && !codeCss.trim() && !codeJs.trim()) {
      setError('At least one code field (HTML, CSS, or JS) is required');
      return;
    }

    try {
      setLoading(true);
      
      const wordCount = blogContent.trim().split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);
      
      const payload = {
        title: blogTitle,
        content: contentType === 'code' ? JSON.stringify({ html: codeHtml, css: codeCss, js: codeJs }) : blogContent,
        contentType: contentType === 'code' ? 'code' : (markdownMode ? 'markdown' : 'richtext'),
        tags: blogTags.split(',').map(t => t.trim()).filter(t => t),
        category: blogCategory,
        preview: preview || null,
        previewType: previewType || null,
        isDraft: isDraft || saveAsDraft,
        status: (isDraft || saveAsDraft) ? 'draft' : 'published',
        readingTime,
        featured: editingBlog?.featured || false
      };

      const response = await api.put(`/blog/${editingBlog._id}`, payload);
      setSuccess((isDraft || saveAsDraft) ? 'Blog saved as draft!' : 'Blog updated successfully!');
      
      setOpenCreateDialog(false);
      setEditingBlog(null);
      setSaveAsDraft(false);
      
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
    
    if (blog.contentType === 'code') {
      try {
        const codeContent = JSON.parse(blog.content);
        setCodeHtml(codeContent.html || '');
        setCodeCss(codeContent.css || '');
        setCodeJs(codeContent.js || '');
      } catch {
        setCodeHtml('');
        setCodeCss('');
        setCodeJs('');
      }
      setBlogContent('');
    } else {
      setBlogContent(blog.content);
      setCodeHtml('');
      setCodeCss('');
      setCodeJs('');
    }
    
    setBlogTags(blog.tags?.join(', ') || '');
    setBlogCategory(blog.category || '');
    setContentType(blog.contentType || 'richtext');
    setMarkdownMode(blog.contentType === 'markdown');
    setCodeHtml(blog.codeHtml || '');
    setCodeCss(blog.codeCss || '');
    setCodeJs(blog.codeJs || '');
    setPreview(blog.preview || '');
    setPreviewType(blog.previewType || '');
    setIsDraft(blog.status === 'draft');
    setOpenCreateDialog(true);
  };

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setBlogTitle('');
    setBlogContent('');
    setBlogTags('');
    setBlogCategory('');
    setCodeHtml('');
    setCodeCss('');
    setCodeJs('');
    setContentType('richtext');
    setMarkdownMode(false);
    setPreview('');
    setPreviewType('');
    setIsDraft(false);
    setSaveAsDraft(false);
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

  // Markdown toolbar functions
  const insertMarkdown = (syntax) => {
    const textarea = document.getElementById('blog-content-textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = blogContent.substring(start, end);
    let newText = '';
    
    switch(syntax) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        break;
      case 'list':
        newText = selectedText ? `- ${selectedText.replace(/\n/g, '\n- ')}` : '- List item';
        break;
      case 'orderedList':
        newText = selectedText ? `1. ${selectedText.replace(/\n/g, '\n2. ')}` : '1. Ordered item';
        break;
      case 'quote':
        newText = selectedText ? `> ${selectedText.replace(/\n/g, '\n> ')}` : '> Quote';
        break;
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`;
        break;
      case 'image':
        newText = `![${selectedText || 'alt text'}](image-url)`;
        break;
      default:
        return;
    }
    
    const beforeText = blogContent.substring(0, start);
    const afterText = blogContent.substring(end);
    
    setBlogContent(beforeText + newText + afterText);
    
    // Focus back on textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Share functions
  const handleShare = (platform, blog = selectedBlog) => {
    if (!blog) return;
    
    const url = `${window.location.origin}/blog/${blog._id}`;
    const text = `Check out this blog: ${blog.title}`;
    
    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setSuccess('Link copied to clipboard!');
        setTimeout(() => setSuccess(''), 2000);
        break;
    }
    
    setShareMenuAnchor(null);
  };

  // Create category
  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const response = await api.post('/blog/categories', { name: newCategory });
      setCategories(prev => [...prev, response.data.category]);
      setNewCategory('');
      setSuccess('Category created!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create category');
    }
  };

  const myBlogs = blogs.filter(blog => blog.author?._id === user?._id);
  const draftBlogs = blogs.filter(blog => blog.status === 'draft' && blog.author?._id === user?._id);

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
        {user && draftBlogs.length > 0 && <Tab label="Drafts" />}
      </Tabs>

      {/* All Blogs Tab */}
      {tabValue === 0 && (
        <Box sx={{ mt: 3 }}>
          {/* Enhanced Search & Filter Bar */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search blogs..."
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="newest">Newest</MenuItem>
                    <MenuItem value="oldest">Oldest</MenuItem>
                    <MenuItem value="popular">Most Popular</MenuItem>
                    <MenuItem value="trending">Trending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Per Page"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {user && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showOnlyMyBlogs}
                          onChange={(e) => setShowOnlyMyBlogs(e.target.checked)}
                          size="small"
                        />
                      }
                      label="My Blogs"
                    />
                  )}
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                  >
                    New Blog
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Tags Filter */}
            {getAllTags().length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
          </Paper>

          {/* Loading Indicator */}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#666' }}>
              <Box sx={{ width: 16, height: 16, border: '2px solid #ddd', borderTopColor: '#1976d2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <Typography variant="caption">Loading blogs...</Typography>
            </Box>
          )}

          {/* No Blogs Found */}
          {blogs.length === 0 && !loading ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No blogs found</Typography>
            </Paper>
          ) : (
            <>
              {/* Blog List */}
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
                      {/* Category Badge */}
                      {blog.category && (
                        <Chip
                          label={blog.category}
                          size="small"
                          sx={{ mb: 1, bgcolor: '#e3f2fd', color: '#1976d2' }}
                        />
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {blog.contentType === 'code' ? <CodeIcon fontSize="small" color="primary" /> : 
                         blog.contentType === 'markdown' ? <ArticleIcon fontSize="small" color="secondary" /> : 
                         <ArticleIcon fontSize="small" color="primary" />}
                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                          {blog.authorName}
                        </Typography>
                        {blog.status === 'draft' && (
                          <Chip
                            label="Draft"
                            size="small"
                            sx={{ bgcolor: '#ffebee', color: '#d32f2f' }}
                          />
                        )}
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
                        {blog.content && blog.content.length > 150 
                          ? `${blog.content.substring(0, 150)}...` 
                          : blog.content}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1.5, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(blog.createdAt).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary' }}>
                          <VisibilityIcon sx={{ fontSize: 14 }} /> {blog.views || 0}
                        </Typography>
                        {blog.readingTime && (
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary' }}>
                            <AccessTimeIcon sx={{ fontSize: 14 }} /> {blog.readingTime} min read
                          </Typography>
                        )}
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

                      {/* Share Button */}
                      <Box sx={{ mt: 1 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBlog(blog);
                            setShareMenuAnchor(e.currentTarget);
                          }}
                        >
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Admin/Auth Controls */}
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
                          startIcon={<ThumbUpIcon />}
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
                          startIcon={<FavoriteIcon />}
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
                          startIcon={<ThumbDownIcon />}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}

              {/* Blog Count */}
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                Showing {blogs.length} of {totalBlogs} blogs
              </Typography>
            </>
          )}
        </Box>
      )}

      {/* Blog Detail Tab */}
      {tabValue === 1 && selectedBlog && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3 }}>
            {/* Share Menu */}
            <Menu
              anchorEl={shareMenuAnchor}
              open={Boolean(shareMenuAnchor)}
              onClose={() => setShareMenuAnchor(null)}
            >
              <MenuItem onClick={() => handleShare('facebook')}>
                <FacebookIcon sx={{ mr: 1 }} /> Share on Facebook
              </MenuItem>
              <MenuItem onClick={() => handleShare('twitter')}>
                <TwitterIcon sx={{ mr: 1 }} /> Share on Twitter
              </MenuItem>
              <MenuItem onClick={() => handleShare('linkedin')}>
                <LinkedInIcon sx={{ mr: 1 }} /> Share on LinkedIn
              </MenuItem>
              <MenuItem onClick={() => handleShare('copy')}>
                <LinkIcon sx={{ mr: 1 }} /> Copy Link
              </MenuItem>
            </Menu>

            {/* Blog Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>{selectedBlog.title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    By {selectedBlog.authorName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(selectedBlog.createdAt).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Typography>
                  {selectedBlog.readingTime && (
                    <Typography variant="body2" color="text.secondary">
                      ⏱️ {selectedBlog.readingTime} min read
                    </Typography>
                  )}
                </Box>
              </Box>
              <IconButton onClick={(e) => setShareMenuAnchor(e.currentTarget)}>
                <ShareIcon />
              </IconButton>
            </Box>

            {/* Category and Tags */}
            <Box sx={{ mb: 3 }}>
              {selectedBlog.category && (
                <Chip
                  label={selectedBlog.category}
                  sx={{ mr: 1, mb: 1, bgcolor: '#e3f2fd', color: '#1976d2' }}
                />
              )}
              {selectedBlog.tags && selectedBlog.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>

            {/* Preview Image/Video */}
            {selectedBlog.preview && (
              <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                {selectedBlog.previewType === 'image' ? (
                  <img
                    src={selectedBlog.preview}
                    alt={selectedBlog.title}
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                ) : (
                  <video
                    src={selectedBlog.preview}
                    controls
                    style={{ width: '100%', maxHeight: '400px' }}
                  />
                )}
              </Box>
            )}

            {/* Blog Content */}
            <Box sx={{ mb: 4 }}>
              {selectedBlog.contentType === 'markdown' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {selectedBlog.content}
                </ReactMarkdown>
              ) : selectedBlog.contentType === 'code' ? (
                <Box>
                  {(() => {
                    try {
                      const code = JSON.parse(selectedBlog.content);
                      return (
                        <>
                          {code.html && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="h6" sx={{ mb: 1 }}>HTML</Typography>
                              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', overflow: 'auto' }}>
                                <pre style={{ margin: 0 }}>{code.html}</pre>
                              </Paper>
                            </Box>
                          )}
                          {code.css && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="h6" sx={{ mb: 1 }}>CSS</Typography>
                              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', overflow: 'auto' }}>
                                <pre style={{ margin: 0 }}>{code.css}</pre>
                              </Paper>
                            </Box>
                          )}
                          {code.js && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="h6" sx={{ mb: 1 }}>JavaScript</Typography>
                              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', overflow: 'auto' }}>
                                <pre style={{ margin: 0 }}>{code.js}</pre>
                              </Paper>
                            </Box>
                          )}
                        </>
                      );
                    } catch {
                      return <Typography>{selectedBlog.content}</Typography>;
                    }
                  })()}
                </Box>
              ) : (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {selectedBlog.content}
                </Typography>
              )}
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{selectedBlog.views || 0}</Typography>
                <Typography variant="caption">Views</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{selectedBlog.likes || 0}</Typography>
                <Typography variant="caption">Likes</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{selectedBlog.loves || 0}</Typography>
                <Typography variant="caption">Loves</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{selectedBlog.dislikes || 0}</Typography>
                <Typography variant="caption">Dislikes</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{selectedBlog.comments?.length || 0}</Typography>
                <Typography variant="caption">Comments</Typography>
              </Box>
            </Box>

            {/* Reactions */}
            <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ThumbUpIcon />}
                onClick={() => handleReaction(selectedBlog._id, 'like')}
                sx={{
                  color: userReactions[selectedBlog._id] === 'like' ? '#1976d2' : 'inherit',
                  borderColor: userReactions[selectedBlog._id] === 'like' ? '#1976d2' : 'inherit'
                }}
              >
                Like ({selectedBlog.likes || 0})
              </Button>
              <Button
                variant="outlined"
                startIcon={<FavoriteIcon />}
                onClick={() => handleReaction(selectedBlog._id, 'love')}
                sx={{
                  color: userReactions[selectedBlog._id] === 'love' ? '#e91e63' : 'inherit',
                  borderColor: userReactions[selectedBlog._id] === 'love' ? '#e91e63' : 'inherit'
                }}
              >
                Love ({selectedBlog.loves || 0})
              </Button>
              <Button
                variant="outlined"
                startIcon={<ThumbDownIcon />}
                onClick={() => handleReaction(selectedBlog._id, 'dislike')}
                sx={{
                  color: userReactions[selectedBlog._id] === 'dislike' ? '#f44336' : 'inherit',
                  borderColor: userReactions[selectedBlog._id] === 'dislike' ? '#f44336' : 'inherit'
                }}
              >
                Dislike ({selectedBlog.dislikes || 0})
              </Button>
            </Box>

            {/* Comments Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Comments ({selectedBlog.comments?.length || 0})</Typography>
              
              {selectedBlog.comments && selectedBlog.comments.length > 0 ? (
                selectedBlog.comments.map(comment => (
                  <Paper key={comment._id} sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {comment.authorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {comment.text}
                    </Typography>
                    {(comment.author?._id === user?._id || isAdmin) && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  No comments yet. Be the first to comment!
                </Typography>
              )}

              {/* Add Comment Form */}
              {user && (
                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleAddComment}
                    disabled={submittingComment || !commentText.trim()}
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {/* My Blogs Tab */}
      {tabValue === 2 && user && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">My Blogs ({myBlogs.length})</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                New Blog
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {myBlogs.map(blog => (
                <Grid item xs={12} key={blog._id}>
                  <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{blog.title}</Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Created: {new Date(blog.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Views: {blog.views || 0}
                        </Typography>
                        {blog.status === 'draft' && (
                          <Chip
                            label="Draft"
                            size="small"
                            sx={{ bgcolor: '#ffebee', color: '#d32f2f' }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Box>
                      <Button size="small" onClick={() => fetchBlogDetail(blog._id)} sx={{ mr: 1 }}>View</Button>
                      <Button size="small" onClick={() => handleEditBlog(blog)} sx={{ mr: 1 }}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDeleteBlog(blog._id)}>Delete</Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* Drafts Tab */}
      {tabValue === 3 && user && draftBlogs.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">My Drafts ({draftBlogs.length})</Typography>
            </Box>
            
            <Grid container spacing={2}>
              {draftBlogs.map(blog => (
                <Grid item xs={12} key={blog._id}>
                  <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{blog.title}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Last edited: {new Date(blog.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Button size="small" onClick={() => handleEditBlog(blog)} sx={{ mr: 1 }}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDeleteBlog(blog._id)}>Delete</Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingBlog ? (isDraft ? 'Edit Draft' : 'Edit Blog') : 'Create New Blog'}</DialogTitle>
        <DialogContent>
          {/* Title */}
          <TextField
            fullWidth
            label="Title"
            value={blogTitle}
            onChange={(e) => setBlogTitle(e.target.value)}
            margin="normal"
            required
          />
          
          {/* Tags */}
          <TextField
            fullWidth
            label="Tags (comma separated)"
            value={blogTags}
            onChange={(e) => setBlogTags(e.target.value)}
            margin="normal"
            helperText="Enter tags separated by commas"
          />
          
          {/* Category */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={blogCategory}
              label="Category"
              onChange={(e) => setBlogCategory(e.target.value)}
            >
              <MenuItem value="">Select Category</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Create New Category */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="New Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Create new category"
            />
            <Button onClick={handleCreateCategory} variant="outlined">
              Add
            </Button>
          </Box>
          
          {/* Content Type */}
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2">Content Type:</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                variant={contentType === 'richtext' ? 'contained' : 'outlined'}
                onClick={() => {
                  setContentType('richtext');
                  setMarkdownMode(false);
                }}
              >
                Rich Text
              </Button>
              <Button
                variant={markdownMode ? 'contained' : 'outlined'}
                onClick={() => {
                  setContentType('richtext');
                  setMarkdownMode(true);
                }}
                color={markdownMode ? 'secondary' : 'primary'}
              >
                Markdown
              </Button>
              <Button
                variant={contentType === 'code' ? 'contained' : 'outlined'}
                onClick={() => setContentType('code')}
              >
                Code
              </Button>
            </Box>
          </Box>
          
          {/* Markdown Toolbar */}
          {markdownMode && contentType !== 'code' && (
            <Paper sx={{ p: 1, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Tooltip title="Bold">
                <IconButton size="small" onClick={() => insertMarkdown('bold')}>
                  <FormatBoldIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Italic">
                <IconButton size="small" onClick={() => insertMarkdown('italic')}>
                  <FormatItalicIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bullet List">
                <IconButton size="small" onClick={() => insertMarkdown('list')}>
                  <FormatListBulletedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Numbered List">
                <IconButton size="small" onClick={() => insertMarkdown('orderedList')}>
                  <FormatListNumberedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Quote">
                <IconButton size="small" onClick={() => insertMarkdown('quote')}>
                  <FormatQuoteIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Link">
                <IconButton size="small" onClick={() => insertMarkdown('link')}>
                  <InsertLinkIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Image">
                <IconButton size="small" onClick={() => insertMarkdown('image')}>
                  <InsertPhotoIcon />
                </IconButton>
              </IconButton>
              </Tooltip>
            </Paper>
          )}
          
          {/* Content Area */}
          {contentType === 'richtext' ? (
            <TextField
              id="blog-content-textarea"
              fullWidth
              label={markdownMode ? "Markdown Content" : "Content"}
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              margin="normal"
              multiline
              rows={8}
              required={!markdownMode}
              helperText={markdownMode ? "Use markdown syntax for formatting" : ""}
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
                helperText="Enter HTML code"
              />
              <TextField
                fullWidth
                label="CSS"
                value={codeCss}
                onChange={(e) => setCodeCss(e.target.value)}
                margin="normal"
                multiline
                rows={4}
                helperText="Enter CSS code"
              />
              <TextField
                fullWidth
                label="JavaScript"
                value={codeJs}
                onChange={(e) => setCodeJs(e.target.value)}
                margin="normal"
                multiline
                rows={4}
                helperText="Enter JavaScript code"
              />
            </Box>
          )}
          
          {/* Preview Upload */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Preview Image/Video (Optional, max 10MB):
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={imageOptimization}
                    onChange={(e) => setImageOptimization(e.target.checked)}
                    size="small"
                  />
                }
                label="Optimize Images"
              />
            </Box>
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
                  <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', marginTop: '8px', borderRadius: '8px' }} />
                ) : (
                  <video src={preview} controls style={{ maxWidth: '100%', maxHeight: '300px', marginTop: '8px', borderRadius: '8px' }} />
                )}
              </Box>
            )}
          </Box>

          {/* Code Preview */}
          {contentType === 'code' && (
            <Button onClick={() => setCodePreview(!codePreview)} sx={{ mt: 2 }}>
              {codePreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          )}
          {codePreview && contentType === 'code' && renderCodePreview()}
          
          {/* Save Options */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={saveAsDraft}
                  onChange={(e) => setSaveAsDraft(e.target.checked)}
                  disabled={isDraft}
                />
              }
              label={isDraft ? "Currently a Draft" : "Save as Draft"}
            />
            {isDraft && (
              <Button
                startIcon={<SaveAsIcon />}
                onClick={() => setSaveAsDraft(false)}
                variant="outlined"
                size="small"
              >
                Publish
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={editingBlog ? handleUpdateBlog : handleCreateBlog}
            variant="contained"
            disabled={loading}
            startIcon={saveAsDraft || isDraft ? <SaveIcon /> : <SendIcon />}
          >
            {loading ? 'Saving...' : (saveAsDraft || isDraft ? 'Save Draft' : (editingBlog ? 'Update' : 'Publish'))}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BlogPage;
