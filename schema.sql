-- Enable UUID extension for robust and obscure public referral identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. GEOGRAPHIC & LOCATION HIERARCHY TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE(country_id, name)
);

CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE(state_id, name)
);

CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE(district_id, name)
);

-- ==========================================
-- 2. EDUCATION HIERARCHY TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS education_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE -- e.g., High School, Diploma, Engineering, Science
);

CREATE TABLE IF NOT EXISTS education_branches (
    id SERIAL PRIMARY KEY,
    level_id INTEGER NOT NULL REFERENCES education_levels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., Mechanical, Computer Science, electrical
    UNIQUE(level_id, name)
);

CREATE TABLE IF NOT EXISTS education_specializations (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES education_branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., Production, Thermodynamics, Robotics
    UNIQUE(branch_id, name)
);

-- ==========================================
-- 3. CORE USER & CANDIDATE REGISTRATION TABLES
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('candidate', 'admin', 'field_executive');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'candidate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(100) UNIQUE,
    referred_by_id INTEGER REFERENCES candidates(id) ON DELETE SET NULL,
    city_id INTEGER NOT NULL REFERENCES cities(id),
    specialization_id INTEGER NOT NULL REFERENCES education_specializations(id),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    registration_source VARCHAR(50) NOT NULL DEFAULT 'web', -- web, link, qr_code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. JOBS & APPLICATION WORKFLOW TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    role_description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    eligibility_criteria TEXT NOT NULL,
    vacancies INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL DEFAULT 'Applied',
    status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS offer_letters (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    offer_letter_code VARCHAR(100) NOT NULL UNIQUE,
    salary_stipend NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    generated_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. SUPPORT CHAT LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS support_chats (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for Query Optimization
CREATE INDEX IF NOT EXISTS idx_candidates_referred ON candidates(referred_by_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_session ON support_chats(sender_id, recipient_id);

-- ==========================================
-- SEQUENCE SYNCHRONIZATION
-- ==========================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'countries') THEN
        PERFORM setval(pg_get_serial_sequence('countries', 'id'), COALESCE((SELECT max(id) FROM countries), 1), true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'states') THEN
        PERFORM setval(pg_get_serial_sequence('states', 'id'), COALESCE((SELECT max(id) FROM states), 1), true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'districts') THEN
        PERFORM setval(pg_get_serial_sequence('districts', 'id'), COALESCE((SELECT max(id) FROM districts), 1), true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cities') THEN
        PERFORM setval(pg_get_serial_sequence('cities', 'id'), COALESCE((SELECT max(id) FROM cities), 1), true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'education_levels') THEN
        PERFORM setval(pg_get_serial_sequence('education_levels', 'id'), COALESCE((SELECT max(id) FROM education_levels), 1), true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'education_branches') THEN
        PERFORM setval(pg_get_serial_sequence('education_branches', 'id'), COALESCE((SELECT max(id) FROM education_branches), 1), true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'education_specializations') THEN
        PERFORM setval(pg_get_serial_sequence('education_specializations', 'id'), COALESCE((SELECT max(id) FROM education_specializations), 1), true);
    END IF;
END $$;

-- ==========================================
-- SEED DATA
-- ==========================================

-- Seed Countries
INSERT INTO countries (name, code) VALUES
('India', 'IN')
ON CONFLICT (name) DO NOTHING;

-- Seed States (linked to Country 1 - India)
INSERT INTO states (country_id, name)
SELECT countries.id, val.name FROM countries, (VALUES 
('Andhra Pradesh'), ('Arunachal Pradesh'), ('Assam'), ('Bihar'), ('Chhattisgarh'), 
('Goa'), ('Gujarat'), ('Haryana'), ('Himachal Pradesh'), ('Jharkhand'), 
('Karnataka'), ('Kerala'), ('Madhya Pradesh'), ('Maharashtra'), ('Manipur'), 
('Meghalaya'), ('Mizoram'), ('Nagaland'), ('Odisha'), ('Punjab'), 
('Rajasthan'), ('Sikkim'), ('Tamil Nadu'), ('Telangana'), ('Tripura'), 
('Uttar Pradesh'), ('Uttarakhand'), ('West Bengal'), ('Delhi'), ('Jammu and Kashmir'), 
('Ladakh'), ('Puducherry'), ('Andaman and Nicobar Islands'), ('Chandigarh'), 
('Dadra and Nagar Haveli and Daman and Diu'), ('Lakshadweep')
) val(name)
WHERE countries.name = 'India'
ON CONFLICT (country_id, name) DO NOTHING;

-- Seed Districts (linked to States)
INSERT INTO districts (state_id, name)
SELECT states.id, val.name FROM states, (VALUES ('Bihar', 'Patna'), ('Bihar', 'Muzaffarpur'), ('Jharkhand', 'Ranchi'), ('Jharkhand', 'East Singhbhum'), ('Odisha', 'Khurda')) val(state_name, name)
WHERE states.name = val.state_name
ON CONFLICT (state_id, name) DO NOTHING;

-- Seed fallback Districts automatically for each State if none exist
INSERT INTO districts (state_id, name)
SELECT id, name || ' District' FROM states
ON CONFLICT (state_id, name) DO NOTHING;

-- Seed Cities (linked to Districts)
INSERT INTO cities (district_id, name)
SELECT districts.id, val.name FROM districts, (VALUES ('Patna', 'Patna Town'), ('Patna', 'Danapur'), ('Muzaffarpur', 'Muzaffarpur Town'), ('Ranchi', 'Ranchi Town'), ('East Singhbhum', 'Jamshedpur'), ('Khurda', 'Bhubaneswar')) val(district_name, name)
WHERE districts.name = val.district_name
ON CONFLICT (district_id, name) DO NOTHING;

-- Seed fallback Cities automatically for each District if none exist
INSERT INTO cities (district_id, name)
SELECT id, REPLACE(name, ' District', ' City') FROM districts
ON CONFLICT (district_id, name) DO NOTHING;


-- Seed Education Levels
INSERT INTO education_levels (name) VALUES
('High School'),
('Diploma'),
('Undergraduate (UG)'),
('Postgraduate (PG)')
ON CONFLICT (name) DO NOTHING;

-- Seed Education Branches
INSERT INTO education_branches (level_id, name)
SELECT education_levels.id, val.name FROM education_levels, (VALUES ('High School', 'General Education'), ('Diploma', 'Engineering Diploma'), ('Diploma', 'Pharmacy Diploma'), ('Undergraduate (UG)', 'Bachelor of Technology (B.Tech)'), ('Undergraduate (UG)', 'Bachelor of Science (B.Sc)'), ('Postgraduate (PG)', 'Master of Technology (M.Tech)'), ('Postgraduate (PG)', 'MBA')) val(level_name, name)
WHERE education_levels.name = val.level_name
ON CONFLICT (level_id, name) DO NOTHING;

-- Seed Education Specializations
INSERT INTO education_specializations (branch_id, name)
SELECT education_branches.id, val.name FROM education_branches, (VALUES ('General Education', 'Matriculation'), ('Engineering Diploma', 'Mechanical Engineering'), ('Engineering Diploma', 'Electrical Engineering'), ('Pharmacy Diploma', 'D.Pharma'), ('Bachelor of Technology (B.Tech)', 'Computer Science & Engineering'), ('Bachelor of Technology (B.Tech)', 'Mechanical Production'), ('Bachelor of Science (B.Sc)', 'Physics Honors'), ('MBA', 'MBA Marketing')) val(branch_name, name)
WHERE education_branches.name = val.branch_name
ON CONFLICT (branch_id, name) DO NOTHING;
