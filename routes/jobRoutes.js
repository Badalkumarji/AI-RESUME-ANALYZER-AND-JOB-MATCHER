const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// ===== POST ROUTES =====
// Create a new job posting
router.post('/', jobController.createJob);

// Filter jobs by criteria (specific route before /:id)
router.post('/filter', jobController.filterJobs);

// ===== GET ROUTES =====
// IMPORTANT: Specific routes MUST come before parameter routes

// Get all jobs
router.get('/', jobController.getAllJobs);

// Get jobs by status - specific route (must be before /:id)
router.get('/status/:status', jobController.getJobsByStatus);

// Get a specific job by ID - generic parameter route (must be last)
router.get('/:id', jobController.getJobById);

// ===== PUT ROUTES =====
// Update a job posting
router.put('/:id', jobController.updateJob);

// ===== DELETE ROUTES =====
// Delete a job posting
router.delete('/:id', jobController.deleteJob);

module.exports = router;
