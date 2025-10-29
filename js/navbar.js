// Navbar component - works across all pages
function initNavbar() {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const navContainer = document.getElementById('mainNav');
    
    if (!navContainer) return;
    
    // Navbar HTML structure
    let navHTML = `
        <nav style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 1rem 5%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
        ">
            <div style="display: flex; align-items: center; gap: 10px;">
                <h1 style="color: white; font-size: 1.8rem; font-weight: 600; margin: 0;">🎯 AI Resume Matcher</h1>
            </div>
            <div id="navLinks" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
    `;
    
    // Check if user is logged in
    if (token && userData.name) {
        // Navigation based on role
        if (userData.role === 'admin') {
            navHTML += `
                <a href="/" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Home</a>
                <a href="/upload.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Upload Resume</a>
                <a href="/jobs.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Manage Jobs</a>
                <a href="/admin-resumes.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">View Resumes</a>
                <a href="/admin-messages.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Messages</a>
                <a href="/contact.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Contact</a>
            `;
        } else if (userData.role === 'user') {
            navHTML += `
                <a href="/" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Home</a>
                <a href="/upload.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Analyze Resume</a>
                <a href="/jobs.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Browse Jobs</a>
                <a href="/matches.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">My Matches</a>
                <a href="/contact.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Contact</a>
            `;
        }
        
        // User info with name and role badge
        const roleColor = userData.role === 'admin' ? '#f5576c' : '#38ef7d';
        const roleLabel = userData.role === 'admin' ? 'Admin' : 'User';
        
        navHTML += `
            <div style="display: flex; align-items: center; gap: 12px; margin-left: 10px; padding: 6px 12px; background: rgba(255,255,255,0.15); border-radius: 8px;">
                <div style="
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: white;
                    color: #667eea;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.1rem;
                ">${userData.name.charAt(0).toUpperCase()}</div>
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                    <span style="color: white; font-weight: 600; font-size: 0.95rem;">${userData.name}</span>
                    <span style="
                        background: ${roleColor};
                        color: white;
                        padding: 2px 8px;
                        border-radius: 10px;
                        font-size: 0.7rem;
                        font-weight: 600;
                        text-transform: uppercase;
                    ">${roleLabel}</span>
                </div>
            </div>
            <button onclick="logout()" style="
                background: rgba(255,255,255,0.2);
                border: 2px solid white;
                color: white;
                padding: 8px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                font-size: 1rem;
                transition: all 0.3s;
            ">Logout</button>
        `;
    } else {
        // Not logged in
        navHTML += `
            <a href="/" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Home</a>
            <a href="/contact.html" style="color: white; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 6px; transition: all 0.3s;">Contact</a>
            <a href="/login.html" style="background: rgba(255,255,255,0.2); border: 2px solid white; color: white; text-decoration: none; padding: 8px 20px; border-radius: 6px; font-weight: 500; transition: all 0.3s;">Login</a>
            <a href="/signup.html" style="background: white; color: #667eea; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; transition: all 0.3s;">Sign Up</a>
        `;
    }
    
    navHTML += `
            </div>
        </nav>
        <style>
            #navLinks a:hover {
                background: rgba(255,255,255,0.2) !important;
            }
            #navLinks button:hover {
                background: white !important;
                color: #667eea !important;
            }
            @media (max-width: 968px) {
                nav {
                    flex-direction: column !important;
                    gap: 1rem !important;
                }
                #navLinks {
                    flex-direction: column !important;
                    width: 100% !important;
                }
                #navLinks a, #navLinks button, #navLinks > div {
                    width: 100% !important;
                    text-align: center !important;
                    justify-content: center !important;
                }
            }
        </style>
    `;
    
    navContainer.innerHTML = navHTML;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Initialize navbar when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}
