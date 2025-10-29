from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

def calculate_match_score(resume_text, job_description, resume_skills, required_skills):
    """Calculate match score between resume and job using TF-IDF and cosine similarity"""
    
    # Text-based similarity using TF-IDF
    documents = [resume_text, job_description]
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(documents)
    text_similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    
    # Skills-based matching
    resume_skills_set = set([skill.lower() for skill in resume_skills])
    required_skills_set = set([skill.lower() for skill in required_skills])
    
    if len(required_skills_set) > 0:
        matched_skills = resume_skills_set.intersection(required_skills_set)
        skills_match_percentage = len(matched_skills) / len(required_skills_set)
    else:
        skills_match_percentage = 0
    
    # Combined score (60% skills, 40% text similarity)
    final_score = (skills_match_percentage * 0.6 + text_similarity * 0.4) * 100
    
    # Identify matched and missing skills
    matched_skills_list = list(resume_skills_set.intersection(required_skills_set))
    skills_gap = list(required_skills_set - resume_skills_set)
    
    return {
        'match_score': round(final_score, 2),
        'text_similarity': round(text_similarity * 100, 2),
        'skills_match': round(skills_match_percentage * 100, 2),
        'matched_skills': matched_skills_list,
        'skills_gap': skills_gap
    }

@app.route('/match', methods=['POST'])
def match_resume_to_job():
    """API endpoint to match resume with job"""
    try:
        data = request.json
        
        resume_text = data.get('resume_text', '')
        job_description = data.get('job_description', '')
        resume_skills = data.get('resume_skills', [])
        required_skills = data.get('required_skills', [])
        
        result = calculate_match_score(
            resume_text, 
            job_description, 
            resume_skills, 
            required_skills
        )
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5002, debug=True)
