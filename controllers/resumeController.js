const Resume = require('../models/Resume');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

exports.uploadResume = async (req, res) => {
  try {
    console.log('📥 Upload request received');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📄 File received:', req.file.originalname);

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).substring(1).toLowerCase();

    console.log('🔍 Parsing resume with Python service...');

    try {
      // Call Python parser service
      const parseResponse = await axios.post('http://localhost:5001/parse', {
        file_path: path.resolve(filePath),
        file_type: fileExt
      }, {
        timeout: 30000
      });

      const parsedData = parseResponse.data;
      console.log('✅ Resume parsed successfully');
      console.log('Extracted data:', {
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        location: parsedData.location,
        github: parsedData.github,
        skills: parsedData.skills?.length,
        languages: parsedData.languages?.length,
        education: parsedData.education?.length,
        experience: parsedData.experience?.length,
        projects: parsedData.projects?.length
      });

      // Analyze resume quality
      let analysis = null;
      try {
        console.log('📊 Analyzing resume quality...');
        const analyzeResponse = await axios.post('http://localhost:5003/analyze', 
          parsedData,
          { timeout: 10000 }
        );
        analysis = analyzeResponse.data;
        console.log('✅ Analysis complete: Score', analysis.overall_score, '/', analysis.max_score);
        console.log('   Rating:', analysis.rating);
        console.log('   Strengths:', analysis.strengths.length);
        console.log('   Suggestions:', analysis.suggestions.length);
      } catch (analyzeError) {
        console.error('⚠️  Analysis service error:', analyzeError.message);
        console.log('⚠️  Continuing without analysis (analyzer service may not be running)');
        // Continue without analysis if service is down
      }

      // Save to MongoDB with all extracted fields
      const resume = new Resume({
        candidateName: parsedData.name || 'Unknown Candidate',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        location: parsedData.location || '',
        github: parsedData.github || '',
        skills: parsedData.skills || [],
        languages: parsedData.languages || [],
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        projects: parsedData.projects || [],
        resumeText: parsedData.resume_text || '',
        fileName: req.file.originalname,
        filePath: filePath,
        parsedData: parsedData
      });

      await resume.save();
      console.log('💾 Resume saved to database with ID:', resume._id);

      res.status(201).json({
        message: 'Resume uploaded and parsed successfully',
        resumeId: resume._id,
        data: resume,
        analysis: analysis  // Include analysis in response (null if analyzer is down)
      });
    } catch (parseError) {
      console.error('❌ Python parser error:', parseError.message);
      
      if (parseError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Resume parser service is not running',
          message: 'Please start the Python resume parser on port 5001'
        });
      }
      
      throw parseError;
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to process resume',
      message: error.message 
    });
  }
};

exports.getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ uploadDate: -1 });
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Delete file from disk
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    res.json({
      message: 'Resume deleted successfully',
      deletedResume: resume
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.searchResumesBySkills = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({
        error: 'Skills array is required'
      });
    }

    const resumes = await Resume.find({
      skills: { $in: skills.map(s => new RegExp(s, 'i')) }
    }).sort({ uploadDate: -1 });

    res.json({
      totalResults: resumes.length,
      searchedSkills: skills,
      resumes
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
};
