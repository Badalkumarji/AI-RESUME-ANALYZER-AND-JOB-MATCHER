const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  matchScore: {
    type: Number,
    required: true
  },
  skillsMatched: [String],
  skillsGap: [String],
  recommendation: String,
  matchedDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Match', matchSchema);
