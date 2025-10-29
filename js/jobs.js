const API_URL = 'http://localhost:5000/api';

// Check user role
const userData = JSON.parse(localStorage.getItem('user') || '{}');
const userRole = userData.role || 'guest';

// Show/hide elements based on role
if (userRole === 'admin') {
    // Admin can post jobs
    document.getElementById('showJobFormBtn').style.display = 'block';
} else {
    // Users cannot post jobs
    document.getElementById('showJobFormBtn').style.display = 'none';
    document.getElementById('jobFormSection').style.display = 'none';
}

// Toggle job form (only for admin)
if (document.getElementById('showJobFormBtn')) {
    document.getElementById('showJobFormBtn').addEventListener('click', () => {
        if (userRole !== 'admin') {
            alert('Only recruiters can post jobs');
            return;
        }
        document.getElementById('jobFormSection').style.display = 'block';
        document.getElementById('showJobFormBtn').style.display = 'none';
    });
}

if (document.getElementById('cancelJobForm')) {
    document.getElementById('cancelJobForm').addEventListener('click', () => {
        document.getElementById('jobFormSection').style.display = 'none';
        if (userRole === 'admin') {
            document.getElementById('showJobFormBtn').style.display = 'block';
        }
        document.getElementById('jobForm').reset();
    });
}

// Post new job (admin only)
if (document.getElementById('jobForm')) {
    document.getElementById('jobForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (userRole !== 'admin') {
            alert('Only recruiters can post jobs');
            return;
        }

        const jobData = {
            title: document.getElementById('title').value,
            company: document.getElementById('company').value,
            description: document.getElementById('description').value,
            requiredSkills: document.getElementById('requiredSkills').value,
            experienceRequired: document.getElementById('experienceRequired').value,
            qualifications: document.getElementById('qualifications').value,
            location: document.getElementById('location').value,
            jobType: document.getElementById('jobType').value
        };

        try {
            const response = await fetch(`${API_URL}/jobs`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(jobData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Job posted successfully!');
                document.getElementById('jobForm').reset();
                document.getElementById('jobFormSection').style.display = 'none';
                document.getElementById('showJobFormBtn').style.display = 'block';
                loadJobs();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to post job');
        }
    });
}

// Load all jobs
async function loadJobs() {
    try {
        const response = await fetch(`${API_URL}/jobs`);
        const data = await response.json();

        const jobsList = document.getElementById('jobsList');
        jobsList.innerHTML = '';

        if (!data.jobs || data.jobs.length === 0) {
            jobsList.innerHTML = '<p>No jobs posted yet.</p>';
            return;
        }

        data.jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            
            const skills = Array.isArray(job.requiredSkills) 
                ? job.requiredSkills 
                : job.requiredSkills.split(',');
            
            jobCard.innerHTML = `
                <h3>${job.title}</h3>
                <p><strong>Company:</strong> ${job.company || 'Not specified'}</p>
                <p><strong>Location:</strong> ${job.location || 'Not specified'}</p>
                <p><strong>Type:</strong> ${job.jobType}</p>
                <p><strong>Experience:</strong> ${job.experienceRequired || 'Not specified'}</p>
                <div class="skills-list">
                    ${skills.map(skill => `<span class="skill-badge">${skill.trim()}</span>`).join('')}
                </div>
                <p><strong>Posted:</strong> ${new Date(job.postedDate).toLocaleDateString()}</p>
                <div class="job-actions">
                    ${userRole === 'user' ? `
                        <button onclick="applyForJob('${job._id}')" class="btn btn-primary">Apply Now</button>
                    ` : ''}
                    ${userRole === 'admin' ? `
                        <button onclick="viewJobDetails('${job._id}')" class="btn btn-primary">View Details</button>
                        <button onclick="deleteJob('${job._id}')" class="btn btn-secondary">Delete</button>
                    ` : ''}
                </div>
            `;
            jobsList.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsList').innerHTML = '<p>Error loading jobs. Please try again.</p>';
    }
}

// Apply for job (user only)
function applyForJob(jobId) {
    if (userRole !== 'user') {
        alert('Only job seekers can apply for jobs');
        return;
    }
    
    // Check if user has uploaded resume
    const hasResume = true; // You can check this from backend
    
    if (!hasResume) {
        if (confirm('You need to upload your resume first. Go to upload page?')) {
            window.location.href = '/upload.html';
        }
        return;
    }
    
    // Redirect to matches page to see how well they match
    window.location.href = `/matches.html?jobId=${jobId}`;
}

// View job details
function viewJobDetails(jobId) {
    alert('Job details view - Feature coming soon!\nJob ID: ' + jobId);
}

// Delete job (admin only)
async function deleteJob(jobId) {
    if (userRole !== 'admin') {
        alert('Only recruiters can delete jobs');
        return;
    }

    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
        const response = await fetch(`${API_URL}/jobs/${jobId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            alert('Job deleted successfully');
            loadJobs();
        } else {
            alert('Failed to delete job');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete job');
    }
}

// Search functionality
if (document.getElementById('searchInput')) {
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterJobs(searchTerm);
    });
}

if (document.getElementById('filterType')) {
    document.getElementById('filterType').addEventListener('change', (e) => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        filterJobs(searchTerm);
    });
}

function filterJobs(searchTerm) {
    const jobCards = document.querySelectorAll('.job-card');
    const filterType = document.getElementById('filterType')?.value;
    
    jobCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const jobType = card.querySelector('p:nth-child(4)')?.textContent || '';
        
        const matchesSearch = text.includes(searchTerm);
        const matchesType = !filterType || jobType.includes(filterType);
        
        if (matchesSearch && matchesType) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Load jobs on page load
loadJobs();
