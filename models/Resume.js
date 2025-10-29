const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  phone: String,
  location: String,
  github: String,
  skills: [String],
  languages: [String],
  experience: [{
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    institution: String,
    degree: String,
    duration: String,
    score: String
  }],
  projects: [{
    name: String,
    technologies: String,
    description: String
  }],
  resumeText: String,
  fileName: String,
  filePath: String,
  uploadDate: {
    type: Date,
    default: Date.now
  },
  parsedData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

module.exports = mongoose.model('Resume', resumeSchema);
