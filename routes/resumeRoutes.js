const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const resumeController = require('../controllers/resumeController');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF and DOCX files
  const allowedTypes = /pdf|docx|doc/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'application/pdf' || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   file.mimetype === 'application/msword';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload resume
router.post('/upload', upload.single('resume'), resumeController.uploadResume);

// Get all resumes
router.get('/', resumeController.getAllResumes);

// Get resume by ID
router.get('/:id', resumeController.getResumeById);

// Delete resume
router.delete('/:id', resumeController.deleteResume);

// Search resumes by skills
router.post('/search', resumeController.searchResumesBySkills);

module.exports = router;
