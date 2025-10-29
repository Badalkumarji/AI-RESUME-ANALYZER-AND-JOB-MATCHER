const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Match a resume to all active jobs - UPDATED ROUTE
router.get('/:resumeId', matchController.matchResumeToJobs);

// Get top candidates for a specific job
router.get('/job/:jobId', matchController.getTopMatches);

// Get all matches for a resume
router.get('/resume/:resumeId/history', matchController.getMatchHistory);

// Rematch all resumes to a specific job (useful after job update)
router.post('/job/:jobId/rematch', matchController.rematchJobWithAllResumes);

module.exports = router;
