const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: String,
  description: {
    type: String,
    required: true
  },
  requiredSkills: [String],
  experienceRequired: String,
  qualifications: [String],
  location: String,
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship']
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  }
});

module.exports = mongoose.model('Job', jobSchema);
