const Resume = require('../models/Resume');
const Job = require('../models/Job');
const Match = require('../models/Match');
const axios = require('axios');

exports.matchResumeToJobs = async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    console.log('🔍 Finding matches for resume:', resumeId);

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Find active jobs (or all jobs if no status field)
    const jobs = await Job.find();
    
    if (!jobs || jobs.length === 0) {
      return res.json({
        candidateName: resume.candidateName,
        totalJobs: 0,
        matches: []
      });
    }

    console.log(`📊 Found ${jobs.length} jobs to match against`);

    const matches = [];

    // Check if Python matching service is available
    let usePythonService = false;
    try {
      await axios.get('http://localhost:5002/health', { timeout: 1000 });
      usePythonService = true;
      console.log('✅ Python matching service available');
    } catch (error) {
      console.log('⚠️  Python matching service not available, using basic matching');
    }

    for (const job of jobs) {
      let matchScore, matchedSkills, skillsGap;

      if (usePythonService) {
        try {
          // Use Python matching service
          const matchResponse = await axios.post('http://localhost:5002/match', {
            resume_text: resume.resumeText,
            job_description: job.description,
            resume_skills: resume.skills,
            required_skills: job.requiredSkills
          }, { timeout: 5000 });

          const matchData = matchResponse.data;
          matchScore = matchData.match_score;
          matchedSkills = matchData.matched_skills;
          skillsGap = matchData.skills_gap;
        } catch (error) {
          console.log('⚠️  Python service failed, falling back to basic matching');
          // Fallback to basic matching
          const basicMatch = calculateBasicMatch(resume, job);
          matchScore = basicMatch.matchScore;
          matchedSkills = basicMatch.matchedSkills;
          skillsGap = basicMatch.skillsGap;
        }
      } else {
        // Use basic matching algorithm
        const basicMatch = calculateBasicMatch(resume, job);
        matchScore = basicMatch.matchScore;
        matchedSkills = basicMatch.matchedSkills;
        skillsGap = basicMatch.skillsGap;
      }

      if (matchScore > 0) {
        // Optionally save to Match model (comment out if you don't want to persist)
        try {
          const match = new Match({
            resumeId: resume._id,
            jobId: job._id,
            matchScore: matchScore,
            skillsMatched: matchedSkills,
            skillsGap: skillsGap,
            recommendation: getRecommendation(matchScore)
          });
          await match.save();
        } catch (saveError) {
          console.log('⚠️  Could not save match to database:', saveError.message);
        }

        matches.push({
          job: job,
          matchScore: matchScore,
          matchedSkills: matchedSkills,
          skillsGap: skillsGap
        });
      }
    }

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    console.log(`✅ Found ${matches.length} matches`);

    res.json({
      candidateName: resume.candidateName,
      totalJobs: jobs.length,
      totalMatches: matches.length,
      matches: matches
    });
  } catch (error) {
    console.error('❌ Matching error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Basic matching algorithm (fallback when Python service is unavailable)
function calculateBasicMatch(resume, job) {
  let score = 0;

  // Skills matching (60% weight)
  const skillsScore = calculateSkillsMatch(resume.skills, job.requiredSkills);
  score += skillsScore * 0.6;

  // Experience matching (20% weight)
  const experienceScore = calculateExperienceMatch(resume.experience, job.experienceRequired);
  score += experienceScore * 0.2;

  // Education matching (20% weight)
  const educationScore = calculateEducationMatch(resume.education, job.qualifications);
  score += educationScore * 0.2;

  const matchedSkills = getMatchedSkills(resume.skills, job.requiredSkills);
  const jobSkillsArray = Array.isArray(job.requiredSkills) 
    ? job.requiredSkills 
    : job.requiredSkills.split(',').map(s => s.trim());
  const skillsGap = jobSkillsArray.filter(skill => 
    !matchedSkills.some(matched => matched.toLowerCase() === skill.toLowerCase())
  );

  return {
    matchScore: Math.round(score),
    matchedSkills: matchedSkills,
    skillsGap: skillsGap
  };
}

function calculateSkillsMatch(resumeSkills, jobSkills) {
  if (!resumeSkills || resumeSkills.length === 0) return 0;
  
  const jobSkillsArray = Array.isArray(jobSkills) 
    ? jobSkills 
    : jobSkills.split(',').map(s => s.trim());

  if (jobSkillsArray.length === 0) return 0;

  const matchedSkills = getMatchedSkills(resumeSkills, jobSkillsArray);
  return (matchedSkills.length / jobSkillsArray.length) * 100;
}

function getMatchedSkills(resumeSkills, jobSkills) {
  if (!resumeSkills || !jobSkills) return [];
  
  const jobSkillsArray = Array.isArray(jobSkills) 
    ? jobSkills 
    : jobSkills.split(',').map(s => s.trim());

  const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
  
  return jobSkillsArray.filter(jobSkill => 
    resumeSkillsLower.some(resumeSkill => 
      resumeSkill.includes(jobSkill.toLowerCase()) || 
      jobSkill.toLowerCase().includes(resumeSkill)
    )
  );
}

function calculateExperienceMatch(resumeExperience, jobExperienceRequired) {
  if (!jobExperienceRequired || jobExperienceRequired.toLowerCase().includes('fresher')) {
    return 100;
  }

  const experienceCount = resumeExperience ? resumeExperience.length : 0;
  const match = jobExperienceRequired.match(/(\d+)/);
  const requiredYears = match ? parseInt(match[0]) : 0;

  if (experienceCount >= requiredYears) {
    return 100;
  } else if (experienceCount > 0) {
    return (experienceCount / requiredYears) * 100;
  }

  return 0;
}

function calculateEducationMatch(resumeEducation, jobQualifications) {
  if (!jobQualifications) return 100;
  if (!resumeEducation || resumeEducation.length === 0) return 50;

  const qualificationsArray = Array.isArray(jobQualifications)
    ? jobQualifications
    : jobQualifications.split(',').map(s => s.trim().toLowerCase());

  const hasMatch = resumeEducation.some(edu => {
    const degree = (edu.degree || '').toLowerCase();
    const institution = (edu.institution || '').toLowerCase();
    
    return qualificationsArray.some(qual => 
      degree.includes(qual) || 
      qual.includes(degree) ||
      institution.includes(qual)
    );
  });

  return hasMatch ? 100 : 50;
}

function getRecommendation(score) {
  if (score >= 80) return 'Excellent match - Highly recommended';
  if (score >= 60) return 'Good match - Recommended';
  if (score >= 40) return 'Moderate match - Consider';
  return 'Low match - Not recommended';
}

exports.getTopMatches = async (req, res) => {
  try {
    const { jobId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const matches = await Match.find({ jobId })
      .populate('resumeId')
      .sort({ matchScore: -1 })
      .limit(limit);

    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMatchHistory = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const matches = await Match.find({ resumeId })
      .populate('jobId')
      .sort({ matchedDate: -1 });

    res.json({
      resumeId,
      totalMatches: matches.length,
      matches
    });
  } catch (error) {
    console.error('Match history error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.rematchJobWithAllResumes = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const resumes = await Resume.find();
    const matches = [];

    await Match.deleteMany({ jobId });

    for (const resume of resumes) {
      const basicMatch = calculateBasicMatch(resume, job);

      const match = new Match({
        resumeId: resume._id,
        jobId: job._id,
        matchScore: basicMatch.matchScore,
        skillsMatched: basicMatch.matchedSkills,
        skillsGap: basicMatch.skillsGap,
        recommendation: getRecommendation(basicMatch.matchScore)
      });

      await match.save();
      matches.push(match);
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      message: 'Rematching completed',
      jobId,
      totalCandidates: resumes.length,
      topMatches: matches.slice(0, 10)
    });
  } catch (error) {
    console.error('Rematch error:', error);
    res.status(500).json({ error: error.message });
  }
};
