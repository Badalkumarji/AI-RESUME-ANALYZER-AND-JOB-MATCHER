const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const matchRoutes = require('./routes/matchRoutes');
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes'); // Add this

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resume_matcher';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log('📦 Database:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });

// API Routes
app.use('/api/auth', authRoutes); // Add this
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/contact', contactRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/signup.html'));
});

app.get('/upload.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/upload.html'));
});

app.get('/jobs.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/jobs.html'));
});

app.get('/matches.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/matches.html'));
});

app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/contact.html'));
});

app.get('/admin-messages.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/admin-messages.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Frontend: http://localhost:${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
});
