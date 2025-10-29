const API_URL = 'http://localhost:5000/api';

// Load statistics on homepage
async function loadStats() {
    try {
        // Get total resumes
        const resumesResponse = await fetch(`${API_URL}/resumes`);
        const resumesData = await resumesResponse.json();
        document.getElementById('totalResumes').textContent = resumesData.length || 0;

        // Get total jobs
        const jobsResponse = await fetch(`${API_URL}/jobs`);
        const jobsData = await jobsResponse.json();
        document.getElementById('totalJobs').textContent = jobsData.totalJobs || 0;

        // Calculate total matches (you can customize this logic)
        const matchesCount = resumesData.length * 3; // Example calculation
        document.getElementById('totalMatches').textContent = matchesCount;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Animate numbers
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}

// Load stats when page loads
if (document.getElementById('totalResumes')) {
    loadStats();
}
