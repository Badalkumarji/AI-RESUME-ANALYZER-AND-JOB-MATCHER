const Job = require('../models/Job');

// Create a new job posting
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      requiredSkills,
      experienceRequired,
      qualifications,
      location,
      jobType
    } = req.body;

    // Validation
    if (!title || !description || !requiredSkills) {
      return res.status(400).json({
        error: 'Title, description, and required skills are mandatory'
      });
    }

    // Check if similar job already exists
    const existingJob = await Job.findOne({
      title: title,
      company: company,
      status: 'active'
    });

    if (existingJob) {
      return res.status(409).json({
        message: 'Similar active job posting already exists',
        job: existingJob
      });
    }

    // Create new job
    const newJob = new Job({
      title,
      company,
      description,
      requiredSkills: Array.isArray(requiredSkills) 
        ? requiredSkills 
        : requiredSkills.split(',').map(skill => skill.trim()),
      experienceRequired,
      qualifications: Array.isArray(qualifications)
        ? qualifications
        : qualifications?.split(',').map(q => q.trim()) || [],
      location,
      jobType: jobType || 'Full-time'
    });

    await newJob.save();

    res.status(201).json({
      message: 'Job posted successfully',
      job: newJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      error: 'Failed to create job posting',
      message: error.message
    });
  }
};

// Get all jobs
exports.getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobs = await Job.find()
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalJobs = await Job.countDocuments();

    res.json({
      totalJobs,
      currentPage: page,
      totalPages: Math.ceil(totalJobs / limit),
      jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch jobs',
      message: error.message
    });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      error: 'Failed to fetch job',
      message: error.message
    });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const updateData = req.body;

    // Convert skills and qualifications to arrays if they're strings
    if (updateData.requiredSkills && typeof updateData.requiredSkills === 'string') {
      updateData.requiredSkills = updateData.requiredSkills
        .split(',')
        .map(skill => skill.trim());
    }

    if (updateData.qualifications && typeof updateData.qualifications === 'string') {
      updateData.qualifications = updateData.qualifications
        .split(',')
        .map(q => q.trim());
    }

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      error: 'Failed to update job',
      message: error.message
    });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    res.json({
      message: 'Job deleted successfully',
      deletedJob: job
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      error: 'Failed to delete job',
      message: error.message
    });
  }
};

// Filter jobs by criteria
exports.filterJobs = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      jobType,
      experienceRequired,
      skills
    } = req.body;

    const filter = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }
    if (company) {
      filter.company = { $regex: company, $options: 'i' };
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (jobType) {
      filter.jobType = jobType;
    }
    if (experienceRequired) {
      filter.experienceRequired = { $regex: experienceRequired, $options: 'i' };
    }
    if (skills && skills.length > 0) {
      filter.requiredSkills = { $in: skills };
    }

    filter.status = 'active';

    const filteredJobs = await Job.find(filter).sort({ postedDate: -1 });

    res.json({
      totalResults: filteredJobs.length,
      jobs: filteredJobs
    });
  } catch (error) {
    console.error('Error filtering jobs:', error);
    res.status(500).json({
      error: 'Failed to filter jobs',
      message: error.message
    });
  }
};

// Get jobs by status
exports.getJobsByStatus = async (req, res) => {
  try {
    const status = req.params.status;

    if (!['active', 'closed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Use "active" or "closed"'
      });
    }

    const jobs = await Job.find({ status }).sort({ postedDate: -1 });

    res.json({
      status,
      totalJobs: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Error fetching jobs by status:', error);
    res.status(500).json({
      error: 'Failed to fetch jobs',
      message: error.message
    });
  }
};
