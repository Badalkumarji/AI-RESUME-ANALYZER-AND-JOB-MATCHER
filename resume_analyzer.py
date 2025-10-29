from flask import Flask, request, jsonify
import re

app = Flask(__name__)

# Action verbs database
STRONG_ACTION_VERBS = [
    'Achieved', 'Developed', 'Implemented', 'Managed', 'Led', 'Created',
    'Designed', 'Built', 'Improved', 'Increased', 'Reduced', 'Optimized',
    'Streamlined', 'Spearheaded', 'Orchestrated', 'Executed', 'Delivered',
    'Launched', 'Established', 'Coordinated', 'Analyzed', 'Resolved'
]

WEAK_ACTION_VERBS = [
    'was', 'did', 'made', 'helped', 'worked', 'responsible for',
    'involved in', 'participated', 'assisted', 'handled'
]

# ATS-friendly keywords by field
INDUSTRY_KEYWORDS = {
    'software': ['Agile', 'Scrum', 'CI/CD', 'DevOps', 'API', 'Git', 'Testing', 
                 'Debugging', 'Code Review', 'Version Control', 'Microservices'],
    'data': ['Machine Learning', 'Data Analysis', 'SQL', 'Python', 'Statistics',
             'Visualization', 'ETL', 'Big Data', 'Analytics', 'Modeling'],
    'web': ['Responsive Design', 'Frontend', 'Backend', 'Full Stack', 'UI/UX',
            'REST API', 'Database', 'Web Security', 'Performance Optimization']
}

def analyze_resume_quality(parsed_data):
    """Analyze resume and provide quality score with suggestions"""
    
    score = 0
    max_score = 100
    suggestions = []
    strengths = []
    
    # 1. Contact Information (15 points)
    contact_score = 0
    if parsed_data.get('name') and parsed_data['name'] != 'Unknown Candidate':
        contact_score += 5
        strengths.append("Name clearly mentioned")
    else:
        suggestions.append("Add your full name at the top of the resume")
    
    if parsed_data.get('email'):
        contact_score += 5
        strengths.append("Email provided")
    else:
        suggestions.append("Include a professional email address")
    
    if parsed_data.get('phone'):
        contact_score += 3
        strengths.append("Phone number included")
    else:
        suggestions.append("Add contact phone number")
    
    if parsed_data.get('location'):
        contact_score += 2
        strengths.append("Location mentioned")
    
    score += contact_score
    
    # 2. Skills Section (25 points)
    skills = parsed_data.get('skills', [])
    skills_count = len(skills)
    
    if skills_count >= 10:
        score += 25
        strengths.append(f"Strong skill set with {skills_count} technical skills")
    elif skills_count >= 6:
        score += 20
        strengths.append(f"Good skill set with {skills_count} skills")
        suggestions.append("Consider adding more relevant technical skills (aim for 10-15)")
    elif skills_count >= 3:
        score += 12
        suggestions.append(f"Only {skills_count} skills listed. Add more relevant technical skills")
    else:
        score += 5
        suggestions.append("Skills section is weak. Add 8-12 relevant technical skills")
    
    # 3. Education (20 points)
    education = parsed_data.get('education', [])
    if len(education) >= 2:
        score += 20
        strengths.append("Complete education history provided")
    elif len(education) == 1:
        score += 15
        suggestions.append("Add more details about your educational background")
    else:
        score += 5
        suggestions.append("Include your education details (degree, institution, year)")
    
    # Check for scores/grades
    has_scores = any(edu.get('score') for edu in education)
    if has_scores:
        strengths.append("Academic performance mentioned")
    else:
        if education:
            suggestions.append("Include your GPA/percentage in education section")
    
    # 4. Experience/Projects (25 points)
    experience = parsed_data.get('experience', [])
    projects = parsed_data.get('projects', [])
    
    exp_project_score = 0
    
    if len(experience) >= 2:
        exp_project_score += 15
        strengths.append(f"{len(experience)} work experiences listed")
    elif len(experience) == 1:
        exp_project_score += 10
        strengths.append("Work experience included")
    else:
        suggestions.append("Add internships or work experience if available")
    
    if len(projects) >= 3:
        exp_project_score += 10
        strengths.append(f"{len(projects)} projects showcased")
    elif len(projects) >= 1:
        exp_project_score += 5
        strengths.append(f"{len(projects)} project(s) mentioned")
        suggestions.append("Add 2-3 more projects to strengthen your profile")
    else:
        suggestions.append("Include 3-5 projects with descriptions and technologies used")
    
    score += exp_project_score
    
    # 5. Additional Information (15 points)
    additional_score = 0
    
    if parsed_data.get('github'):
        additional_score += 5
        strengths.append("GitHub profile included")
    else:
        suggestions.append("Add GitHub profile link to showcase your code")
    
    if parsed_data.get('languages') and len(parsed_data['languages']) >= 2:
        additional_score += 5
        strengths.append("Multilingual abilities mentioned")
    elif parsed_data.get('languages'):
        additional_score += 3
    else:
        suggestions.append("Mention languages you speak (English, Hindi, etc.)")
    
    # Check resume length
    resume_text = parsed_data.get('resume_text', '')
    word_count = len(resume_text.split())
    
    if 400 <= word_count <= 800:
        additional_score += 5
        strengths.append("Optimal resume length")
    elif word_count < 400:
        suggestions.append("Resume seems too short. Add more details about experience and projects")
    else:
        suggestions.append("Resume is lengthy. Try to keep it concise (1-2 pages)")
    
    score += additional_score
    
    # Generate overall rating
    if score >= 85:
        rating = "Excellent"
        overall_feedback = "Your resume is well-structured and comprehensive! Minor improvements will make it even better."
    elif score >= 70:
        rating = "Good"
        overall_feedback = "Your resume is good but has room for improvement. Focus on the suggestions below."
    elif score >= 55:
        rating = "Average"
        overall_feedback = "Your resume needs significant improvements. Address the key suggestions to make it more competitive."
    else:
        rating = "Needs Improvement"
        overall_feedback = "Your resume requires major enhancements. Focus on adding missing sections and details."
    
    # Section-wise breakdown
    section_scores = {
        "Contact Information": {
            "score": contact_score,
            "max": 15,
            "percentage": round((contact_score / 15) * 100)
        },
        "Skills": {
            "score": min(25, (skills_count / 10) * 25),
            "max": 25,
            "percentage": round(min(100, (skills_count / 10) * 100))
        },
        "Education": {
            "score": min(20, len(education) * 10),
            "max": 20,
            "percentage": round(min(100, (len(education) / 2) * 100))
        },
        "Experience & Projects": {
            "score": exp_project_score,
            "max": 25,
            "percentage": round((exp_project_score / 25) * 100)
        },
        "Additional Info": {
            "score": additional_score,
            "max": 15,
            "percentage": round((additional_score / 15) * 100)
        }
    }
    
    return {
        "overall_score": round(score),
        "max_score": max_score,
        "percentage": round((score / max_score) * 100),
        "rating": rating,
        "overall_feedback": overall_feedback,
        "strengths": strengths,
        "suggestions": suggestions,
        "section_scores": section_scores,
        "stats": {
            "skills_count": skills_count,
            "education_count": len(education),
            "experience_count": len(experience),
            "projects_count": len(projects),
            "word_count": word_count
        }
    }

def analyze_ats_optimization(parsed_data, resume_text):
    """Analyze ATS optimization and provide tips"""
    
    ats_score = 0
    max_ats_score = 100
    ats_tips = []
    keyword_suggestions = []
    action_verb_analysis = []
    
    # 1. Contact Information Check (10 points)
    if parsed_data.get('email') and parsed_data.get('phone'):
        ats_score += 10
    else:
        ats_tips.append({
            'category': 'Contact Information',
            'issue': 'Missing contact details',
            'tip': 'Add complete contact information: Email, Phone, and Location at the top',
            'priority': 'High'
        })
    
    # 2. File Format Check (10 points)
    ats_score += 10
    
    # 3. Keyword Density (20 points)
    skills = parsed_data.get('skills', [])
    if len(skills) >= 10:
        ats_score += 20
    elif len(skills) >= 6:
        ats_score += 15
        ats_tips.append({
            'category': 'Keywords',
            'issue': 'Limited technical keywords',
            'tip': 'Add 3-5 more relevant technical skills and technologies',
            'priority': 'High'
        })
    else:
        ats_score += 5
        ats_tips.append({
            'category': 'Keywords',
            'issue': 'Very few keywords detected',
            'tip': 'Add 8-12 relevant technical skills, tools, and technologies',
            'priority': 'Critical'
        })
    
    # 4. Section Headers (15 points)
    required_sections = ['education', 'experience', 'skills', 'projects']
    sections_found = [s for s in required_sections if parsed_data.get(s) and len(parsed_data.get(s)) > 0]
    
    section_score = (len(sections_found) / len(required_sections)) * 15
    ats_score += section_score
    
    if len(sections_found) < len(required_sections):
        missing = set(required_sections) - set(sections_found)
        ats_tips.append({
            'category': 'Structure',
            'issue': f'Missing sections: {", ".join(missing)}',
            'tip': f'Add clear sections for: {", ".join(missing).upper()}',
            'priority': 'Medium'
        })
    
    # 5. Quantifiable Achievements (15 points)
    numbers_in_text = len(re.findall(r'\d+%?', resume_text))
    if numbers_in_text >= 5:
        ats_score += 15
    elif numbers_in_text >= 3:
        ats_score += 10
        ats_tips.append({
            'category': 'Achievements',
            'issue': 'Few quantifiable metrics',
            'tip': 'Add numbers, percentages, and metrics to showcase your impact (e.g., "Increased efficiency by 30%")',
            'priority': 'High'
        })
    else:
        ats_score += 5
        ats_tips.append({
            'category': 'Achievements',
            'issue': 'No quantifiable achievements',
            'tip': 'Use numbers to quantify your achievements (e.g., "Managed team of 5", "Reduced costs by 25%")',
            'priority': 'Critical'
        })
    
    # 6. Action Verbs Analysis (15 points)
    text_lower = resume_text.lower()
    strong_verbs_found = [verb for verb in STRONG_ACTION_VERBS if verb.lower() in text_lower]
    weak_verbs_found = [verb for verb in WEAK_ACTION_VERBS if verb.lower() in text_lower]
    
    if len(strong_verbs_found) >= 5:
        ats_score += 15
        action_verb_analysis.append({
            'status': 'good',
            'message': f'Great! Found {len(strong_verbs_found)} strong action verbs',
            'verbs': strong_verbs_found[:10]
        })
    elif len(strong_verbs_found) >= 3:
        ats_score += 10
        action_verb_analysis.append({
            'status': 'okay',
            'message': f'Found {len(strong_verbs_found)} action verbs. Add more!',
            'verbs': strong_verbs_found
        })
    else:
        ats_score += 5
        action_verb_analysis.append({
            'status': 'poor',
            'message': 'Very few strong action verbs detected',
            'verbs': strong_verbs_found
        })
    
    if weak_verbs_found:
        suggestions = []
        for weak in weak_verbs_found[:3]:
            suggestions.append({
                'weak': weak,
                'strong_alternatives': ['Achieved', 'Developed', 'Implemented', 'Led']
            })
        
        ats_tips.append({
            'category': 'Action Verbs',
            'issue': f'Found weak phrases: {", ".join(weak_verbs_found[:3])}',
            'tip': 'Replace weak phrases with strong action verbs like: ' + ', '.join(STRONG_ACTION_VERBS[:5]),
            'priority': 'Medium',
            'suggestions': suggestions
        })
    
    # 7. Resume Length (10 points)
    word_count = len(resume_text.split())
    if 400 <= word_count <= 800:
        ats_score += 10
    elif word_count < 400:
        ats_score += 5
        ats_tips.append({
            'category': 'Length',
            'issue': 'Resume is too short',
            'tip': 'Expand your experience and project descriptions. Aim for 400-800 words.',
            'priority': 'Medium'
        })
    else:
        ats_score += 7
        ats_tips.append({
            'category': 'Length',
            'issue': 'Resume is too long',
            'tip': 'Keep resume concise. Remove unnecessary details. Aim for 1-2 pages.',
            'priority': 'Low'
        })
    
    # 8. Formatting Issues (5 points)
    ats_score += 5
    
    # Keyword Suggestions
    keyword_suggestions = suggest_keywords(parsed_data.get('skills', []))
    
    return {
        'ats_score': round(ats_score),
        'max_score': max_ats_score,
        'percentage': round((ats_score / max_ats_score) * 100),
        'ats_tips': ats_tips,
        'keyword_suggestions': keyword_suggestions,
        'action_verb_analysis': action_verb_analysis,
        'strong_verbs_found': len(strong_verbs_found),
        'recommended_verbs': [v for v in STRONG_ACTION_VERBS if v.lower() not in text_lower][:10]
    }

def suggest_keywords(current_skills):
    """Suggest additional keywords based on current skills"""
    suggestions = []
    skills_lower = [s.lower() for s in current_skills]
    
    # Software development keywords
    if any(skill in skills_lower for skill in ['javascript', 'python', 'java', 'node', 'react']):
        missing_keywords = [kw for kw in INDUSTRY_KEYWORDS['software'] if kw.lower() not in skills_lower]
        if missing_keywords:
            suggestions.append({
                'category': 'Software Development',
                'keywords': missing_keywords[:8]
            })
    
    # Data science keywords
    if any(skill in skills_lower for skill in ['python', 'sql', 'data', 'machine learning']):
        missing_keywords = [kw for kw in INDUSTRY_KEYWORDS['data'] if kw.lower() not in skills_lower]
        if missing_keywords:
            suggestions.append({
                'category': 'Data Science',
                'keywords': missing_keywords[:8]
            })
    
    # Web development keywords
    if any(skill in skills_lower for skill in ['html', 'css', 'react', 'javascript']):
        missing_keywords = [kw for kw in INDUSTRY_KEYWORDS['web'] if kw.lower() not in skills_lower]
        if missing_keywords:
            suggestions.append({
                'category': 'Web Development',
                'keywords': missing_keywords[:8]
            })
    
    return suggestions

@app.route('/analyze', methods=['POST'])
def analyze_endpoint():
    """API endpoint to analyze resume quality and ATS optimization"""
    try:
        print("📊 Analysis request received")
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Basic quality analysis
        quality_analysis = analyze_resume_quality(data)
        
        # ATS optimization analysis
        resume_text = data.get('resume_text', '')
        ats_analysis = analyze_ats_optimization(data, resume_text)
        
        # Combine results
        result = {
            **quality_analysis,
            'ats_optimization': ats_analysis
        }
        
        print(f"✅ Analysis complete: Quality {quality_analysis['overall_score']}, ATS {ats_analysis['ats_score']}")
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'running'}), 200

if __name__ == '__main__':
    print("🚀 Starting Resume Analyzer Service on port 5003")
    print("📍 Endpoint: http://127.0.0.1:5003/analyze")
    print("📍 Health check: http://127.0.0.1:5003/health")
    app.run(port=5003, debug=True)
