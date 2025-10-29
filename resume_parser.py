import spacy
import fitz  # PyMuPDF
from docx import Document
import re
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Load spaCy model with error handling
try:
    nlp = spacy.load('en_core_web_sm')
    print("✅ spaCy model loaded successfully")
except Exception as e:
    print(f"⚠️  Warning: Could not load spaCy model: {e}")
    nlp = None

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file"""
    text = ""
    try:
        print(f"📄 Opening PDF: {pdf_path}")
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
        doc.close()
        print(f"✅ Extracted {len(text)} characters from PDF")
    except Exception as e:
        print(f"❌ Error extracting PDF: {e}")
        raise
    return text

def extract_text_from_docx(docx_path):
    """Extract text from DOCX file"""
    text = ""
    try:
        print(f"📄 Opening DOCX: {docx_path}")
        if not os.path.exists(docx_path):
            raise FileNotFoundError(f"DOCX file not found: {docx_path}")
        
        doc = Document(docx_path)
        for paragraph in doc.paragraphs:
            text += paragraph.text + '\n'
        print(f"✅ Extracted {len(text)} characters from DOCX")
    except Exception as e:
        print(f"❌ Error extracting DOCX: {e}")
        raise
    return text

def extract_email(text):
    """Extract email from concatenated text - improved version"""
    if not text:
        return None
    
    # Email pattern that stops at domain extension
    email_pattern = r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:com|in|org|net|edu|co|gov|mil)'
    
    # Method 1: Direct search in original text
    match = re.search(email_pattern, text, re.IGNORECASE)
    if match:
        return match.group(0)
    
    # Method 2: Remove all whitespace and try again
    text_no_space = ''.join(text.split())
    match = re.search(email_pattern, text_no_space, re.IGNORECASE)
    if match:
        return match.group(0)
    
    # Method 3: Manual extraction around @ symbol
    if '@' in text:
        at_index = text.find('@')
        # Get 30 chars before and after
        start = max(0, at_index - 30)
        end = min(len(text), at_index + 40)
        chunk = text[start:end].replace('\n', '').replace(' ', '')
        
        match = re.search(email_pattern, chunk, re.IGNORECASE)
        if match:
            return match.group(0)
    
    return None

def extract_phone(text):
    """Extract phone number from resume text"""
    text_clean = text.replace('\n', ' ').replace('\r', ' ')
    
    patterns = [
        r'\+91[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{4}',
        r'\+91[-\s]?\d{10}',
        r'\d{10}',
        r'\(\+91\)[-\s]?\d{10}',
    ]
    
    for pattern in patterns:
        phones = re.findall(pattern, text_clean)
        if phones:
            phone = phones[0].replace(' ', '').replace('-', '')
            return phone
    
    return None

def extract_location(text):
    """Extract location from resume"""
    location_pattern = r'([A-Z][a-z]+,\s*[A-Z][a-z]+(?:\s*\(\d+\))?)'
    locations = re.findall(location_pattern, text)
    return locations[0] if locations else None

def extract_github(text):
    """Extract GitHub profile"""
    github_pattern = r'https?://github\.com/[\w-]+'
    github_links = re.findall(github_pattern, text)
    return github_links[0] if github_links else None

def extract_skills(text):
    """Extract skills from resume using keyword matching"""
    skills_keywords = [
        'Python', 'Java', 'JavaScript', 'Node.js', 'React', 'Angular', 'Vue',
        'MongoDB', 'MySQL', 'PostgreSQL', 'SQL', 'NoSQL', 'JDBC',
        'Machine Learning', 'AI', 'Data Science', 'Deep Learning',
        'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
        'HTML', 'CSS', 'TypeScript', 'C++', 'C#', 'PHP',
        'Git', 'REST API', 'RESTful API', 'GraphQL', 'Express', 'Django', 'Flask',
        'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Bootstrap',
        'jQuery', 'Next.js', 'Spring Boot', 'FastAPI', 'Pandas', 'NumPy',
        'Postman', 'Github', 'HTML5', 'CSS3', 'AJAX', 'JSON',
        'Data Structures', 'Algorithms', 'OOP', 'CRUD'
    ]
    
    found_skills = []
    text_lower = text.lower()
    
    for skill in skills_keywords:
        if skill.lower() in text_lower:
            found_skills.append(skill)
    
    return sorted(list(set(found_skills)))

def extract_languages(text):
    """Extract languages from resume"""
    languages = []
    common_languages = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Punjabi', 'Tamil', 'Telugu']
    
    # Look for LANGUAGES section
    lines = text.split('\n')
    in_language_section = False
    
    for i, line in enumerate(lines):
        if 'language' in line.lower():
            in_language_section = True
            # Check next few lines for languages
            for j in range(i+1, min(i+5, len(lines))):
                next_line = lines[j].strip()
                for lang in common_languages:
                    if lang.lower() in next_line.lower():
                        languages.append(lang)
                # Stop if we hit another section
                if next_line.isupper() and len(next_line) > 3:
                    break
            break
    
    return list(set(languages))

def extract_education(text):
    """Extract education details from resume"""
    education = []
    lines = text.split('\n')
    
    # Common degree keywords
    degree_keywords = ['bachelor', 'master', 'mca', 'bca', 'b.sc', 'm.sc', 'btech', 'mtech', 
                      'intermediate', 'matriculation', 'diploma', 'phd', 'degree']
    
    # Common education markers
    markers = ['university', 'college', 'school', 'institute', 'cgpa', 'percentage', 'gpa']
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        line_lower = line.lower()
        
        # Check if this line contains degree or education marker
        if any(keyword in line_lower for keyword in degree_keywords + markers):
            edu_entry = {
                'institution': '',
                'degree': '',
                'duration': '',
                'score': ''
            }
            
            # Extract institution (usually in ALL CAPS or Title Case)
            if line.isupper() or (line and line[0].isupper()):
                edu_entry['institution'] = line
            
            # Look at next 5 lines for details
            for j in range(i, min(i+6, len(lines))):
                current_line = lines[j].strip()
                current_lower = current_line.lower()
                
                # Extract degree
                if any(deg in current_lower for deg in degree_keywords):
                    edu_entry['degree'] = current_line
                
                # Extract CGPA/Percentage
                if 'cgpa' in current_lower or 'percentage' in current_lower or 'gpa' in current_lower:
                    edu_entry['score'] = current_line
                
                # Extract year/duration (4-digit year pattern)
                year_pattern = r'\d{4}\s*-\s*\d{4}|\d{4}'
                years = re.findall(year_pattern, current_line)
                if years:
                    edu_entry['duration'] = current_line
            
            if edu_entry['degree'] or edu_entry['institution']:
                education.append(edu_entry)
                i += 5  # Skip processed lines
                continue
        
        i += 1
    
    return education

def extract_experience(text):
    """Extract work experience from resume"""
    experience = []
    lines = text.split('\n')
    
    # Keywords indicating experience section
    exp_keywords = ['experience', 'work history', 'employment', 'internship', 'project']
    
    in_exp_section = False
    current_exp = None
    
    for i, line in enumerate(lines):
        line_lower = line.strip().lower()
        
        # Check if we're entering experience section
        if any(keyword in line_lower for keyword in exp_keywords) and len(line.strip()) < 30:
            in_exp_section = True
            continue
        
        # Stop if we hit another major section
        if in_exp_section and line.strip().isupper() and len(line.strip()) > 3:
            if line.strip().lower() not in ['experience', 'projects']:
                in_exp_section = False
                if current_exp:
                    experience.append(current_exp)
                    current_exp = None
                continue
        
        # In experience section, look for experience entries
        if in_exp_section and line.strip():
            # Check for date patterns (experience duration)
            date_pattern = r'\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*Present|[A-Z][a-z]+\s+\d{4}'
            if re.search(date_pattern, line):
                if current_exp:
                    experience.append(current_exp)
                current_exp = {
                    'title': '',
                    'company': '',
                    'duration': line.strip(),
                    'description': ''
                }
            elif current_exp:
                # Add to description
                if not current_exp['title']:
                    current_exp['title'] = line.strip()
                elif not current_exp['company'] and i > 0:
                    current_exp['company'] = line.strip()
                else:
                    if current_exp['description']:
                        current_exp['description'] += ' ' + line.strip()
                    else:
                        current_exp['description'] = line.strip()
    
    if current_exp:
        experience.append(current_exp)
    
    return experience

def extract_projects(text):
    """Extract projects from resume - improved version"""
    projects = []
    lines = text.split('\n')
    
    in_project_section = False
    current_project = None
    project_title_indicators = ['|', 'using', 'with', 'technologies', 'tech stack']
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        line_lower = line_stripped.lower()
        
        # Check if we're entering projects section
        if 'project' in line_lower and len(line_stripped) < 30 and line_stripped.isupper():
            in_project_section = True
            print(f"📂 Found PROJECTS section")
            continue
        
        # Stop if we hit another major section (all caps, short line)
        if in_project_section and line_stripped.isupper() and len(line_stripped) > 3 and len(line_stripped) < 30:
            if 'project' not in line_lower:
                print(f"📂 Exiting projects section at: {line_stripped}")
                in_project_section = False
                if current_project and (current_project['name'] or current_project['description']):
                    projects.append(current_project)
                    print(f"✅ Added project: {current_project['name']}")
                break
        
        # In projects section
        if in_project_section and line_stripped:
            # Check if this is a new project title
            # Project titles usually have: pipe separator, "using", or are followed by tech stack
            is_new_project = False
            
            # Pattern 1: Has pipe separator (Title | Technologies)
            if '|' in line_stripped:
                is_new_project = True
                parts = line_stripped.split('|')
                tech_part = parts[1].strip() if len(parts) > 1 else ''
                
                # Save previous project
                if current_project and (current_project['name'] or current_project['description']):
                    projects.append(current_project)
                    print(f"✅ Added project: {current_project['name']}")
                
                # Start new project
                current_project = {
                    'name': parts[0].strip(),
                    'technologies': tech_part,
                    'description': ''
                }
                print(f"📌 New project found: {current_project['name']}")
            
            # Pattern 2: Line with "using", "with", "technologies" (likely project title with tech)
            elif any(indicator in line_lower for indicator in ['using', 'with ', 'technologies:']):
                # This might be part of project title/tech stack
                if not current_project:
                    # New project starting
                    current_project = {
                        'name': line_stripped,
                        'technologies': '',
                        'description': ''
                    }
                    print(f"📌 New project found: {current_project['name']}")
                else:
                    # Could be tech stack for current project
                    if not current_project['technologies']:
                        current_project['technologies'] = line_stripped
            
            # Pattern 3: Standalone project title (long line, title case, no description words)
            elif (len(line_stripped) > 15 and 
                  line_stripped[0].isupper() and 
                  not line_lower.startswith(('developed', 'created', 'built', 'implemented', 'designed'))):
                
                # Check if previous line or next line has tech indicators
                prev_line = lines[i-1].strip().lower() if i > 0 else ''
                next_line = lines[i+1].strip().lower() if i < len(lines)-1 else ''
                
                # If this looks like a new project title (not a description)
                if (not any(word in line_lower for word in ['the', 'this', 'that', 'which', 'where', 'and implemented']) and
                    len(line_stripped.split()) <= 10):  # Project titles are usually short
                    
                    # Save previous project
                    if current_project and (current_project['name'] or current_project['description']):
                        projects.append(current_project)
                        print(f"✅ Added project: {current_project['name']}")
                    
                    # Start new project
                    current_project = {
                        'name': line_stripped,
                        'technologies': '',
                        'description': ''
                    }
                    print(f"📌 New project found: {current_project['name']}")
                else:
                    # This is a description line
                    if current_project:
                        if current_project['description']:
                            current_project['description'] += ' ' + line_stripped
                        else:
                            current_project['description'] = line_stripped
            
            # Pattern 4: Description line (add to current project)
            else:
                if current_project:
                    if current_project['description']:
                        current_project['description'] += ' ' + line_stripped
                    else:
                        current_project['description'] = line_stripped
    
    # Don't forget the last project
    if current_project and (current_project['name'] or current_project['description']):
        projects.append(current_project)
        print(f"✅ Added final project: {current_project['name']}")
    
    print(f"📊 Total projects extracted: {len(projects)}")
    return projects


def extract_name(text):
    """Extract name from resume"""
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    if not lines:
        return "Unknown Candidate"
    
    first_line = lines[0].strip()
    
    skill_keywords = [
        'python', 'java', 'javascript', 'react', 'node', 'sql', 
        'html', 'css', 'git', 'skills', 'education', 'contact'
    ]
    
    if (len(first_line) <= 30 and 
        first_line.lower() not in skill_keywords and
        not any(keyword in first_line.lower() for keyword in skill_keywords)):
        
        letter_count = sum(1 for c in first_line if c.isalpha())
        if letter_count >= len(first_line) * 0.7:
            return first_line.title()
    
    return "Unknown Candidate"

def parse_resume(file_path, file_type):
    """Main function to parse resume with all details"""
    print(f"🔍 Parsing resume: {file_path} (type: {file_type})")
    
    try:
        # Extract text based on file type
        if file_type == 'pdf':
            text = extract_text_from_pdf(file_path)
        elif file_type in ['docx', 'doc']:
            text = extract_text_from_docx(file_path)
        else:
            return {'error': f'Unsupported file type: {file_type}'}
        
        if not text or len(text.strip()) < 10:
            return {'error': 'Could not extract text from file or file is empty'}
        
        # Extract all information
        parsed_data = {
            'name': extract_name(text),
            'email': extract_email(text),
            'phone': extract_phone(text),
            'location': extract_location(text),
            'github': extract_github(text),
            'skills': extract_skills(text),
            'languages': extract_languages(text),
            'education': extract_education(text),
            'experience': extract_experience(text),
            'projects': extract_projects(text),
            'resume_text': text[:5000]
        }
        
        print(f"✅ Parsing complete:")
        print(f"   Name: {parsed_data['name']}")
        print(f"   Email: {parsed_data['email']}")
        print(f"   Phone: {parsed_data['phone']}")
        print(f"   Skills: {len(parsed_data['skills'])} found")
        print(f"   Languages: {len(parsed_data['languages'])} found")
        print(f"   Education: {len(parsed_data['education'])} entries")
        print(f"   Experience: {len(parsed_data['experience'])} entries")
        print(f"   Projects: {len(parsed_data['projects'])} found")
        
        return parsed_data
    except Exception as e:
        print(f"❌ Parsing error: {e}")
        return {'error': str(e)}

@app.route('/parse', methods=['POST'])
def parse_resume_endpoint():
    """API endpoint to parse resume"""
    try:
        print("📥 Parse request received")
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        file_path = data.get('file_path')
        file_type = data.get('file_type')
        
        if not file_path or not file_type:
            return jsonify({'error': 'file_path and file_type are required'}), 400
        
        result = parse_resume(file_path, file_type)
        
        if 'error' in result:
            return jsonify(result), 500
        
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'spacy_loaded': nlp is not None
    }), 200

if __name__ == '__main__':
    print("🚀 Starting Resume Parser Service on port 5001")
    print("📍 Endpoint: http://127.0.0.1:5001/parse")
    print("📍 Health check: http://127.0.0.1:5001/health")
    app.run(port=5001, debug=True)
