-- Users table: both job seekers and employers
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('job_seeker', 'employer') NOT NULL,
  hometown VARCHAR(100),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7)
);

-- Employers' company info
CREATE TABLE companies (
  company_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  city VARCHAR(100),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Job listings
CREATE TABLE jobs (
  job_id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  job_type ENUM('Full-time', 'Part-time', 'Internship') NOT NULL,
  industry VARCHAR(100),
  experience_level VARCHAR(50),
  location VARCHAR(100),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  salary_min INT,
  salary_max INT,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Applications (for future enhancement)
CREATE TABLE applications (
  application_id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  user_id INT NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Applied',
  FOREIGN KEY (job_id) REFERENCES jobs(job_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Sample data (3 jobs in UP area)
INSERT INTO users (name, email, password_hash, role, hometown, latitude, longitude)
VALUES
('ABC Pvt Ltd HR', 'hr@abc.com', 'dummyhash', 'employer', 'Lucknow', 26.8467, 80.9462),
('XYZ Solutions HR', 'hr@xyz.com', 'dummyhash', 'employer', 'Kanpur', 26.4499, 80.3319);

INSERT INTO companies (user_id, company_name, city, latitude, longitude)
VALUES
(1, 'ABC Pvt Ltd', 'Lucknow', 26.8467, 80.9462),
(2, 'XYZ Solutions', 'Kanpur', 26.4499, 80.3319);

INSERT INTO jobs (company_id, title, description, job_type, industry, experience_level, location, latitude, longitude, salary_min, salary_max)
VALUES
(1, 'Frontend Developer', 'HTML/CSS/JS local job.', 'Full-time', 'IT', '0-1 years', 'Lucknow', 26.8467, 80.9462, 15000, 25000),
(1, 'Data Entry Operator', 'Simple office data entry.', 'Part-time', 'Back Office', 'Fresher', 'Lucknow', 26.85, 80.94, 8000, 12000),
(2, 'Java Intern', 'Java + SQL internship.', 'Internship', 'IT', 'Internship', 'Kanpur', 26.4499, 80.3319, 5000, 8000);
