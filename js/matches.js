const API_URL = 'http://localhost:5000/api';

// Load all resumes for selection
async function loadResumes() {
    try {
        const response = await fetch(`${API_URL}/resumes`);
        const resumes = await response.json();
        
        const resumeSelect = document.getElementById('resumeSelect');
        resumeSelect.innerHTML = '<option value="">-- Select Resume --</option>';
        
        resumes.forEach(resume => {
            const option = document.createElement('option');
            option.value = resume._id;
            option.textContent = `${resume.candidateName} (${resume.email || 'No email'})`;
            resumeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading resumes:', error);
    }
}

// Find matches button
document.getElementById('findMatchesBtn').addEventListener('click', async () => {
    const resumeId = document.getElementById('resumeSelect').value;
    
    if (!resumeId) {
        alert('Please select a resume first');
        return;
    }
    
    await findMatches(resumeId);
});

// Find matches for selected resume
async function findMatches(resumeId) {
    const loadingSection = document.getElementById('loadingSection');
    const matchesSection = document.getElementById('matchesSection');
    const noMatchesSection = document.getElementById('noMatchesSection');
    
    // Show loading
    loadingSection.style.display = 'block';
    matchesSection.style.display = 'none';
    noMatchesSection.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/matches/resume/${resumeId}`);
        const data = await response.json();
        
        loadingSection.style.display = 'none';
        
        if (!data.matches || data.matches.length === 0) {
            noMatchesSection.style.display = 'block';
            return;
        }
        
        // Display matches
        matchesSection.style.display = 'block';
        document.getElementById('candidateName').textContent = data.candidateName;
        document.getElementById('matchCount').textContent = data.matches.length;
        
        const matchesList = document.getElementById('matchesList');
        matchesList.innerHTML = '';
        
        data.matches.forEach(match => {
            const matchCard = createMatchCard(match);
            matchesList.appendChild(matchCard);
        });
        
    } catch (error) {
        console.error('Error finding matches:', error);
        loadingSection.style.display = 'none';
        alert('Failed to find matches. Please try again.');
    }
}

// Create match card element
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    const score = match.matchScore;
    let scoreClass = 'score-low';
    if (score >= 80) scoreClass = 'score-excellent';
    else if (score >= 60) scoreClass = 'score-good';
    else if (score >= 40) scoreClass = 'score-moderate';
    
    const matchedSkills = match.skillsMatched || [];
    const gapSkills = match.skillsGap || [];
    
    card.innerHTML = `
        <div class="match-score">
            <div class="score-circle ${scoreClass}">
                ${Math.round(score)}%
            </div>
            <p>${getScoreLabel(score)}</p>
        </div>
        <div class="match-details">
            <h3>${match.job.title}</h3>
            <p><strong>Company:</strong> ${match.job.company || 'Not specified'}</p>
            <p><strong>Location:</strong> ${match.job.location || 'Not specified'}</p>
            <p><strong>Type:</strong> ${match.job.jobType}</p>
            <p><strong>Description:</strong> ${match.job.description.substring(0, 150)}...</p>
            
            <div class="matched-skills">
                <h4>✅ Matched Skills (${matchedSkills.length})</h4>
                <div class="skills-container">
                    ${matchedSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            
            ${gapSkills.length > 0 ? `
                <div class="gap-skills">
                    <h4>📚 Skills to Learn (${gapSkills.length})</h4>
                    <div class="skills-container">
                        ${gapSkills.map(skill => `<span class="skill-tag" style="background: #f5576c;">${skill}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

function getScoreLabel(score) {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Moderate Match';
    return 'Low Match';
}

// Check for resumeId in URL parameters
const urlParams = new URLSearchParams(window.location.search);
const resumeIdFromUrl = urlParams.get('resumeId');

if (resumeIdFromUrl) {
    // Auto-load matches if resumeId is in URL
    document.getElementById('resumeSelect').value = resumeIdFromUrl;
    findMatches(resumeIdFromUrl);
}

// Load resumes on page load
loadResumes();
