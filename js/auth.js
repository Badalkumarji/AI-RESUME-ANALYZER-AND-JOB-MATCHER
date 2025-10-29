const API_URL = 'http://localhost:5000/api';

// Handle Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showSuccess('Login successful! Redirecting...');

                // Redirect based on role
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = '/jobs.html';
                    } else {
                        window.location.href = '/upload.html';
                    }
                }, 1000);
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (error) {
            showError('Network error. Please try again.');
            console.error('Login error:', error);
        }
    });
}

// Handle Signup
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showSuccess('Account created successfully! Redirecting...');

                // Redirect based on role
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = '/jobs.html';
                    } else {
                        window.location.href = '/upload.html';
                    }
                }, 1000);
            } else {
                showError(data.error || 'Registration failed');
            }
        } catch (error) {
            showError('Network error. Please try again.');
            console.error('Signup error:', error);
        }
    });
}

// Helper functions
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Check authentication on protected pages
function checkAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
    }
}

// Export for use in other scripts
window.auth = {
    isLoggedIn,
    getCurrentUser,
    logout,
    checkAuth
};
