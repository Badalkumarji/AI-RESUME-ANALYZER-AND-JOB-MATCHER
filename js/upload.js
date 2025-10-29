const API_URL = 'http://localhost:5000/api';
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');

let currentResumeId = null;

// Check user role
const userData = JSON.parse(localStorage.getItem('user') || '{}');
const userRole = userData.role || 'guest';

// Hide recent uploads section for regular users
if (userRole === 'user') {
    const recentUploadsSection = document.getElementById('recentUploads');
    if (recentUploadsSection && recentUploadsSection.parentElement) {
        recentUploadsSection.parentElement.style.display = 'none';
    }
}

// Drag and drop handlers
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
        dropArea.classList.add('drag-over');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
        dropArea.classList.remove('drag-over');
    });
});

dropArea.addEventListener('drop', handleDrop);
dropArea.addEventListener('click', () => fileInput.click());
selectFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
});

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

async function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or DOCX file');
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    await uploadResume(file);
}

async function uploadResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    
    // Show progress
    uploadProgress.style.display = 'block';
    resultSection.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = 'Uploading...';
    
    try {
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressFill.style.width = progress + '%';
            }
        }, 200);
        
        const response = await fetch(`${API_URL}/resumes/upload`, {
            method: 'POST',
            body: formData
        });
        
        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        
        const result = await response.json();
        
        if (response.ok) {
            progressText.textContent = 'Upload successful!';
            
            // Store analysis data globally
            window.currentAnalysis = result.analysis;
            
            setTimeout(() => {
                displayResults(result.data);
                currentResumeId = result.resumeId;
                
                // Only load recent uploads for admin
                if (userRole === 'admin') {
                    loadRecentUploads();
                }
            }, 500);
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Error uploading resume:', error);
        progressText.textContent = 'Upload failed: ' + error.message;
        alert('Failed to upload resume: ' + error.message);
        uploadProgress.style.display = 'none';
    }
}

function createAnalysisPanel(analysis) {
    const scorePercentage = analysis.percentage;
    let scoreColor = '#f5576c';
    if (scorePercentage >= 85) scoreColor = '#38ef7d';
    else if (scorePercentage >= 70) scoreColor = '#667eea';
    else if (scorePercentage >= 55) scoreColor = '#f093fb';
    
    let html = `
        <div style="background: linear-gradient(135deg, ${scoreColor}15 0%, ${scoreColor}05 100%); 
                    padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 2px solid ${scoreColor}30;">
            <h3 style="color: ${scoreColor}; margin-bottom: 15px; display: flex; align-items: center;">
                <span style="font-size: 1.5rem; margin-right: 10px;">📊</span>
                Resume Quality Analysis
            </h3>
            
            <!-- Overall Score -->
            <div style="display: flex; align-items: center; gap: 30px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="position: relative; width: 120px; height: 120px;">
                    <svg width="120" height="120" style="transform: rotate(-90deg);">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" stroke-width="10"/>
                        <circle cx="60" cy="60" r="50" fill="none" stroke="${scoreColor}" stroke-width="10"
                                stroke-dasharray="${(scorePercentage / 100) * 314} 314" 
                                stroke-linecap="round"
                                style="transition: stroke-dasharray 1s ease;"/>
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: bold; color: ${scoreColor};">${scorePercentage}%</div>
                    </div>
                </div>
                <div style="flex: 1; min-width: 250px;">
                    <div style="font-size: 1.5rem; font-weight: 600; color: ${scoreColor}; margin-bottom: 5px;">
                        ${analysis.rating}
                    </div>
                    <div style="color: #666; line-height: 1.6;">
                        ${analysis.overall_feedback}
                    </div>
                    <div style="margin-top: 10px; color: #999; font-size: 0.9rem;">
                        📄 ${analysis.stats.word_count} words | 
                        💼 ${analysis.stats.skills_count} skills | 
                        📚 ${analysis.stats.education_count} education | 
                        🚀 ${analysis.stats.projects_count} projects
                    </div>
                </div>
            </div>
            
            <!-- Section Scores -->
            <div style="margin: 20px 0;">
                <h4 style="color: #333; margin-bottom: 15px; font-size: 1.1rem;">Section-wise Breakdown</h4>
                ${Object.entries(analysis.section_scores).map(([section, data]) => `
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: #666; font-weight: 500;">${section}</span>
                            <span style="color: ${scoreColor}; font-weight: 600;">${data.percentage}%</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${data.percentage}%; height: 100%; background: ${scoreColor}; transition: width 1s ease;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Strengths -->
            ${analysis.strengths.length > 0 ? `
                <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="color: #38ef7d; margin-bottom: 10px; font-size: 1rem;">✅ Strengths</h4>
                    <ul style="margin: 0; padding-left: 20px; list-style: none;">
                        ${analysis.strengths.map(strength => `
                            <li style="color: #555; margin: 8px 0; padding-left: 10px; position: relative;">
                                <span style="position: absolute; left: -15px; color: #38ef7d;">•</span>
                                ${strength}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <!-- Suggestions -->
            ${analysis.suggestions.length > 0 ? `
                <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="color: #f5576c; margin-bottom: 10px; font-size: 1rem;">💡 Suggestions for Improvement</h4>
                    <ul style="margin: 0; padding-left: 20px; list-style: none;">
                        ${analysis.suggestions.map(suggestion => `
                            <li style="color: #555; margin: 8px 0; padding-left: 10px; position: relative;">
                                <span style="position: absolute; left: -15px; color: #f5576c;">•</span>
                                ${suggestion}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    return html;
}

// Add this function after createAnalysisPanel function

function createATSPanel(atsData) {
    if (!atsData) return '';
    
    const scorePercentage = atsData.percentage;
    let scoreColor = '#f5576c';
    if (scorePercentage >= 80) scoreColor = '#38ef7d';
    else if (scorePercentage >= 60) scoreColor = '#667eea';
    else if (scorePercentage >= 40) scoreColor = '#f093fb';
    
    let html = `
        <div style="background: linear-gradient(135deg, ${scoreColor}15 0%, ${scoreColor}05 100%); 
                    padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 2px solid ${scoreColor}30;">
            <h3 style="color: ${scoreColor}; margin-bottom: 15px; display: flex; align-items: center;">
                <span style="font-size: 1.5rem; margin-right: 10px;">🎯</span>
                ATS Optimization Score
            </h3>
            
            <!-- ATS Score -->
            <div style="display: flex; align-items: center; gap: 30px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="position: relative; width: 120px; height: 120px;">
                    <svg width="120" height="120" style="transform: rotate(-90deg);">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" stroke-width="10"/>
                        <circle cx="60" cy="60" r="50" fill="none" stroke="${scoreColor}" stroke-width="10"
                                stroke-dasharray="${(scorePercentage / 100) * 314} 314" 
                                stroke-linecap="round"
                                style="transition: stroke-dasharray 1s ease;"/>
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: bold; color: ${scoreColor};">${scorePercentage}%</div>
                    </div>
                </div>
                <div style="flex: 1; min-width: 250px;">
                    <div style="font-size: 1.3rem; font-weight: 600; color: ${scoreColor}; margin-bottom: 5px;">
                        ${scorePercentage >= 80 ? 'ATS-Friendly' : scorePercentage >= 60 ? 'Good Progress' : 'Needs Improvement'}
                    </div>
                    <div style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                        Your resume scores ${atsData.ats_score}/${atsData.max_score} on ATS optimization
                    </div>
                    <div style="color: #999; font-size: 0.9rem;">
                        💪 ${atsData.strong_verbs_found} strong action verbs found
                    </div>
                </div>
            </div>
            
            <!-- ATS Tips -->
            ${atsData.ats_tips && atsData.ats_tips.length > 0 ? `
                <div style="margin: 20px 0;">
                    <h4 style="color: #333; margin-bottom: 15px; font-size: 1.1rem;">🚀 Optimization Tips</h4>
                    ${atsData.ats_tips.map(tip => {
                        const priorityColors = {
                            'Critical': '#f5576c',
                            'High': '#ff9800',
                            'Medium': '#667eea',
                            'Low': '#38ef7d'
                        };
                        const priorityColor = priorityColors[tip.priority] || '#666';
                        
                        return `
                            <div style="
                                margin-bottom: 15px; 
                                padding: 15px; 
                                background: white; 
                                border-radius: 8px; 
                                border-left: 4px solid ${priorityColor};
                                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <strong style="color: #333; font-size: 1rem;">📌 ${tip.category}</strong>
                                    <span style="
                                        background: ${priorityColor};
                                        color: white;
                                        padding: 3px 10px;
                                        border-radius: 12px;
                                        font-size: 0.75rem;
                                        font-weight: 600;
                                    ">${tip.priority}</span>
                                </div>
                                <div style="color: #f5576c; margin-bottom: 5px; font-size: 0.9rem;">
                                    ⚠️ ${tip.issue}
                                </div>
                                <div style="color: #555; line-height: 1.5;">
                                    💡 ${tip.tip}
                                </div>
                                ${tip.suggestions ? `
                                    <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                                        <strong style="color: #667eea; font-size: 0.9rem;">Suggested replacements:</strong>
                                        ${tip.suggestions.map(s => `
                                            <div style="margin: 5px 0; font-size: 0.85rem;">
                                                <span style="color: #f5576c; text-decoration: line-through;">${s.weak}</span>
                                                <span style="color: #666;"> → </span>
                                                <span style="color: #38ef7d;">${s.strong_alternatives.join(', ')}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
            
            <!-- Keyword Suggestions -->
            ${atsData.keyword_suggestions && atsData.keyword_suggestions.length > 0 ? `
                <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="color: #667eea; margin-bottom: 15px; font-size: 1rem;">🔑 Recommended Keywords to Add</h4>
                    ${atsData.keyword_suggestions.map(category => `
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #333; font-size: 0.95rem;">${category.category}:</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                                ${category.keywords.map(keyword => `
                                    <span style="
                                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                        color: white;
                                        padding: 6px 14px;
                                        border-radius: 20px;
                                        font-size: 0.85rem;
                                        font-weight: 500;
                                    ">${keyword}</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Action Verbs -->
            ${atsData.recommended_verbs && atsData.recommended_verbs.length > 0 ? `
                <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="color: #38ef7d; margin-bottom: 15px; font-size: 1rem;">💪 Powerful Action Verbs to Use</h4>
                    <div style="color: #666; margin-bottom: 10px; font-size: 0.9rem;">
                        Start your bullet points with these strong action verbs:
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${atsData.recommended_verbs.map(verb => `
                            <span style="
                                background: #38ef7d;
                                color: white;
                                padding: 6px 14px;
                                border-radius: 20px;
                                font-size: 0.85rem;
                                font-weight: 500;
                            ">${verb}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Action Verb Analysis -->
            ${atsData.action_verb_analysis && atsData.action_verb_analysis.length > 0 ? `
                <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${atsData.action_verb_analysis.map(analysis => {
                        const statusColors = {
                            'good': '#38ef7d',
                            'okay': '#667eea',
                            'poor': '#f5576c'
                        };
                        const statusColor = statusColors[analysis.status] || '#666';
                        
                        return `
                            <div style="margin-bottom: 10px;">
                                <strong style="color: ${statusColor};">
                                    ${analysis.status === 'good' ? '✅' : analysis.status === 'okay' ? '⚠️' : '❌'}
                                    ${analysis.message}
                                </strong>
                                ${analysis.verbs && analysis.verbs.length > 0 ? `
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                                        ${analysis.verbs.map(verb => `
                                            <span style="
                                                background: ${statusColor}20;
                                                color: ${statusColor};
                                                padding: 4px 10px;
                                                border-radius: 15px;
                                                font-size: 0.8rem;
                                                font-weight: 500;
                                            ">${verb}</span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    return html;
}


function displayResults(data) {
    uploadProgress.style.display = 'none';
    resultSection.style.display = 'block';
    
    // Clear previous results
    const resultCard = document.querySelector('.result-card');
    resultCard.innerHTML = '';
    
    let htmlContent = '';
    
    // Show resume quality analysis panel first if available
    if (window.currentAnalysis) {
        htmlContent += createAnalysisPanel(window.currentAnalysis);
        
        // Show ATS optimization panel if available
        if (window.currentAnalysis.ats_optimization) {
            htmlContent += createATSPanel(window.currentAnalysis.ats_optimization);
        }
    }
    
    // Extracted Information Section
    htmlContent += `<h3 style="color: #667eea; margin-top: 30px; margin-bottom: 20px;">📄 Extracted Information</h3>`;
    
    // Basic Info Section
    htmlContent += `
        <div class="result-row">
            <strong>Name:</strong>
            <span>${data.candidateName || 'Not found'}</span>
        </div>
        <div class="result-row">
            <strong>Email:</strong>
            <span>${data.email || 'Not found'}</span>
        </div>
        <div class="result-row">
            <strong>Phone:</strong>
            <span>${data.phone || 'Not found'}</span>
        </div>
    `;
    
    // Location
    if (data.location) {
        htmlContent += `
            <div class="result-row">
                <strong>Location:</strong>
                <span>${data.location}</span>
            </div>
        `;
    }
    
    // GitHub
    if (data.github) {
        htmlContent += `
            <div class="result-row">
                <strong>GitHub:</strong>
                <span><a href="${data.github}" target="_blank" style="color: #667eea; text-decoration: none;">${data.github}</a></span>
            </div>
        `;
    }
    
    // Skills Section
    htmlContent += `
        <div class="result-row">
            <strong>Skills Extracted:</strong>
            <div id="resultSkills" class="skills-container" style="margin-top: 10px;">
    `;
    
    if (data.skills && data.skills.length > 0) {
        data.skills.forEach(skill => {
            htmlContent += `<span class="skill-tag">${skill}</span>`;
        });
    } else {
        htmlContent += '<span style="color: #999;">No skills extracted</span>';
    }
    
    htmlContent += `
            </div>
        </div>
    `;
    
    // Languages
    if (data.languages && data.languages.length > 0) {
        htmlContent += `
            <div class="result-row">
                <strong>Languages:</strong>
                <span>${data.languages.join(', ')}</span>
            </div>
        `;
    }
    
    // Education Section
    if (data.education && data.education.length > 0) {
        htmlContent += `
            <div class="result-row">
                <strong>Education:</strong>
                <div style="margin-top: 10px;">
        `;
        
        data.education.forEach(edu => {
            htmlContent += `
                <div style="margin: 10px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
                        ${edu.degree || edu.institution}
                    </div>
            `;
            
            if (edu.institution && edu.degree) {
                htmlContent += `<div style="color: #666; margin-bottom: 3px;">${edu.institution}</div>`;
            }
            
            if (edu.score) {
                htmlContent += `<div style="color: #667eea; font-weight: 500; margin-bottom: 3px;">${edu.score}</div>`;
            }
            
            if (edu.duration) {
                htmlContent += `<div style="color: #999; font-size: 0.9rem;">${edu.duration}</div>`;
            }
            
            htmlContent += `</div>`;
        });
        
        htmlContent += `
                </div>
            </div>
        `;
    }
    
    // Experience Section
    if (data.experience && data.experience.length > 0) {
        htmlContent += `
            <div class="result-row">
                <strong>Experience:</strong>
                <div style="margin-top: 10px;">
        `;
        
        data.experience.forEach(exp => {
            htmlContent += `
                <div style="margin: 10px 0; padding: 15px; background: #f0f4ff; border-radius: 8px; border-left: 4px solid #764ba2;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
                        ${exp.title || 'Position'}
                    </div>
            `;
            
            if (exp.company) {
                htmlContent += `<div style="color: #666; margin-bottom: 3px;">${exp.company}</div>`;
            }
            
            if (exp.duration) {
                htmlContent += `<div style="color: #999; font-size: 0.9rem; margin-bottom: 5px;">${exp.duration}</div>`;
            }
            
            if (exp.description) {
                htmlContent += `<div style="color: #555; margin-top: 8px; line-height: 1.5;">${exp.description.substring(0, 300)}${exp.description.length > 300 ? '...' : ''}</div>`;
            }
            
            htmlContent += `</div>`;
        });
        
        htmlContent += `
                </div>
            </div>
        `;
    }
    
    // Projects Section
    if (data.projects && data.projects.length > 0) {
        htmlContent += `
            <div class="result-row">
                <strong>Projects:</strong>
                <div style="margin-top: 10px;">
        `;
        
        data.projects.forEach(proj => {
            htmlContent += `
                <div style="margin: 10px 0; padding: 15px; background: #fff8f0; border-radius: 8px; border-left: 4px solid #f5576c;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
                        ${proj.name}
                    </div>
            `;
            
            if (proj.technologies) {
                htmlContent += `<div style="color: #667eea; font-weight: 500; margin-bottom: 5px;">${proj.technologies}</div>`;
            }
            
            if (proj.description) {
                htmlContent += `<div style="color: #555; margin-top: 8px; line-height: 1.5;">${proj.description.substring(0, 250)}${proj.description.length > 250 ? '...' : ''}</div>`;
            }
            
            htmlContent += `</div>`;
        });
        
        htmlContent += `
                </div>
            </div>
        `;
    }
    
    // Insert all content
    resultCard.innerHTML = htmlContent;
}


// View matches button
if (document.getElementById('viewMatchesBtn')) {
    document.getElementById('viewMatchesBtn').addEventListener('click', () => {
        if (currentResumeId) {
            window.location.href = `matches.html?resumeId=${currentResumeId}`;
        }
    });
}

// Upload another button
if (document.getElementById('uploadAnotherBtn')) {
    document.getElementById('uploadAnotherBtn').addEventListener('click', () => {
        resultSection.style.display = 'none';
        fileInput.value = '';
        currentResumeId = null;
        window.currentAnalysis = null;
    });
}

// Load recent uploads (only for admin)
async function loadRecentUploads() {
    // Only load if user is admin and element exists
    if (userRole !== 'admin') return;
    
    try {
        const response = await fetch(`${API_URL}/resumes`);
        const resumes = await response.json();
        
        const recentUploads = document.getElementById('recentUploads');
        if (!recentUploads) return;
        
        recentUploads.innerHTML = '';
        
        if (resumes.length === 0) {
            recentUploads.innerHTML = '<p style="text-align: center; color: #999;">No resumes uploaded yet</p>';
            return;
        }
        
        resumes.slice(0, 5).forEach(resume => {
            const resumeItem = document.createElement('div');
            resumeItem.className = 'resume-item';
            resumeItem.innerHTML = `
                <div class="resume-info">
                    <h4>${resume.candidateName}</h4>
                    <p>${resume.email || 'No email'} • Uploaded: ${new Date(resume.uploadDate).toLocaleDateString()}</p>
                    ${resume.skills && resume.skills.length > 0 ? `<p style="color: #667eea; font-size: 0.9rem;">Skills: ${resume.skills.slice(0, 5).join(', ')}${resume.skills.length > 5 ? '...' : ''}</p>` : ''}
                </div>
                <div>
                    <button onclick="viewResumeMatches('${resume._id}')" class="btn btn-primary">View Matches</button>
                </div>
            `;
            recentUploads.appendChild(resumeItem);
        });
    } catch (error) {
        console.error('Error loading recent uploads:', error);
    }
}

function viewResumeMatches(resumeId) {
    window.location.href = `matches.html?resumeId=${resumeId}`;
}

// Load recent uploads on page load (only for admin)
if (document.getElementById('recentUploads') && userRole === 'admin') {
    loadRecentUploads();
}
