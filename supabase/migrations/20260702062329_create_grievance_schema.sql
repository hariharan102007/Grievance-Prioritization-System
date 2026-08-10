/*
# Create Grievance Prioritization System schema

1. Overview
This migration creates the core schema for an AI-powered citizen complaint
management platform. The app is single-tenant (no sign-in screen), so all
policies use `TO anon, authenticated` and there are no user_id columns.

2. New Tables
- `departments`: Maps complaint categories to government departments.
  - id (uuid, pk)
  - name (text, unique) - department name e.g. "Water Department"
  - category (text, unique) - category it handles e.g. "Water Supply"
  - description (text)
  - created_at (timestamptz)
- `complaints`: The main complaints table with AI-generated fields.
  - id (uuid, pk)
  - ticket_id (text, unique) - human-readable ID like CMP10001
  - title (text) - short summary of the complaint
  - description (text, not null) - the complaint text
  - category (text) - AI-detected category
  - department (text) - auto-routed department
  - priority (text) - Critical / High / Medium / Low
  - status (text) - Registered / Assigned / In Progress / Resolved
  - location (text) - free text location
  - lat (float8) - latitude
  - lng (float8) - longitude
  - language (text) - detected language
  - sentiment (text) - positive / neutral / negative / urgent
  - duplicate_of (uuid, nullable) - references another complaint if duplicate
  - duplicate_count (int, default 0) - how many complaints match this one
  - officer_remarks (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)
  - resolved_at (timestamptz, nullable)
- `audit_logs`: Tracks status changes and actions on complaints.
  - id (uuid, pk)
  - complaint_id (uuid, fk -> complaints)
  - action (text)
  - from_status (text)
  - to_status (text)
  - remarks (text)
  - created_at (timestamptz)

3. Indexes
- complaints(ticket_id) - unique lookup by ticket id
- complaints(status) - filter by status on officer dashboard
- complaints(priority) - sort by priority
- complaints(category) - analytics grouping
- complaints(department) - department filtering
- complaints(duplicate_of) - find duplicates
- audit_logs(complaint_id) - join to complaints

4. Security
- RLS enabled on all three tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant, no-auth demo app where the data is intentionally
  shared/public across the citizen portal, officer dashboard, and admin dashboard.

5. Seed Data
- 6 departments with their category mappings.
- A small set of sample complaints so dashboards render with content on first load.
*/

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_departments" ON departments;
CREATE POLICY "anon_select_departments" ON departments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_departments" ON departments;
CREATE POLICY "anon_insert_departments" ON departments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_departments" ON departments;
CREATE POLICY "anon_update_departments" ON departments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_departments" ON departments;
CREATE POLICY "anon_delete_departments" ON departments FOR DELETE
  TO anon, authenticated USING (true);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text UNIQUE NOT NULL,
  title text,
  description text NOT NULL,
  category text,
  department text,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Registered',
  location text,
  lat float8,
  lng float8,
  language text DEFAULT 'English',
  sentiment text DEFAULT 'neutral',
  duplicate_of uuid REFERENCES complaints(id) ON DELETE SET NULL,
  duplicate_count int NOT NULL DEFAULT 0,
  officer_remarks text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_complaints" ON complaints;
CREATE POLICY "anon_select_complaints" ON complaints FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_complaints" ON complaints;
CREATE POLICY "anon_insert_complaints" ON complaints FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_complaints" ON complaints;
CREATE POLICY "anon_update_complaints" ON complaints FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_complaints" ON complaints;
CREATE POLICY "anon_delete_complaints" ON complaints FOR DELETE
  TO anon, authenticated USING (true);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_status text,
  to_status text,
  remarks text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_audit_logs" ON audit_logs;
CREATE POLICY "anon_update_audit_logs" ON audit_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;
CREATE POLICY "anon_delete_audit_logs" ON audit_logs FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_ticket_id ON complaints(ticket_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department);
CREATE INDEX IF NOT EXISTS idx_complaints_duplicate_of ON complaints(duplicate_of);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_complaint_id ON audit_logs(complaint_id);

-- Seed departments
INSERT INTO departments (name, category, description) VALUES
  ('Water Department', 'Water Supply', 'Handles water supply, leakage, and pipeline issues'),
  ('Electricity Department', 'Electricity', 'Handles power outages, wiring, and streetlight issues'),
  ('Public Works Department', 'Roads', 'Handles road repair, potholes, and infrastructure'),
  ('Sanitation Department', 'Sanitation', 'Handles garbage collection, waste, and cleanliness'),
  ('Health Department', 'Healthcare', 'Handles public health, hospitals, and sanitation hazards'),
  ('Police Department', 'Public Safety', 'Handles crime, safety, and law enforcement')
ON CONFLICT (category) DO NOTHING;

-- Seed sample complaints so dashboards render with content
INSERT INTO complaints (ticket_id, description, category, department, priority, status, location, language, sentiment, duplicate_count, photo_url, created_at, resolved_at)
VALUES
  ('CMP10001', 'Water leakage near the district hospital has been flooding the road for 3 days. Patients cannot reach the emergency ward.', 'Water Supply', 'Water Department', 'Critical', 'Assigned', 'Near District Hospital, Sector 12', 'English', 'urgent', 4, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop', now() - interval '2 days', NULL),
  ('CMP10002', 'Pipe burst near district hospital, water everywhere, ambulances stuck.', 'Water Supply', 'Water Department', 'Critical', 'Assigned', 'District Hospital Road', 'English', 'urgent', 0, 'https://images.unsplash.com/photo-1542013936693-8848e574047a?w=800&auto=format&fit=crop', now() - interval '1 day', NULL),
  ('CMP10003', 'Live electric wire hanging near the school gate. Children are at risk of electrocution. Please fix immediately.', 'Electricity', 'Electricity Department', 'Critical', 'In Progress', 'Government School, Sector 7', 'English', 'urgent', 2, 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=800&auto=format&fit=crop', now() - interval '5 hours', NULL),
  ('CMP10004', 'Garbage not collected for 5 days in our area. Foul smell and mosquitoes everywhere.', 'Sanitation', 'Sanitation Department', 'High', 'Registered', 'Gandhi Nagar, Ward 4', 'English', 'negative', 1, 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop', now() - interval '3 hours', NULL),
  ('CMP10005', 'Large pothole on MG Road caused a bike accident last night. Needs urgent repair.', 'Roads', 'Public Works Department', 'High', 'Assigned', 'MG Road, near Signal 5', 'English', 'negative', 0, 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&auto=format&fit=crop', now() - interval '6 hours', NULL),
  ('CMP10006', 'Streetlight not working on Lane 3 for a week. Unsafe at night.', 'Electricity', 'Electricity Department', 'Medium', 'Registered', 'Lane 3, Anna Nagar', 'English', 'negative', 0, 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&auto=format&fit=crop', now() - interval '1 day', NULL),
  ('CMP10007', 'Hospital staff rude and made us wait 4 hours for a checkup.', 'Healthcare', 'Health Department', 'Medium', 'In Progress', 'City Hospital, OPD', 'English', 'negative', 0, 'https://images.unsplash.com/photo-1538108149393-fdfd812903b8?w=800&auto=format&fit=crop', now() - interval '2 days', NULL),
  ('CMP10008', 'Bus stop shelter broken, no seating for elderly passengers.', 'Transport', 'Public Works Department', 'Low', 'Resolved', 'Bus Stop, Main Road', 'English', 'neutral', 0, 'https://images.unsplash.com/photo-1464219222984-216ebffaaf85?w=800&auto=format&fit=crop', now() - interval '10 days', now() - interval '8 days'),
  ('CMP10009', 'Stray dogs causing nuisance near the park. Children afraid to play.', 'Public Safety', 'Police Department', 'Medium', 'Resolved', 'Central Park, Sector 3', 'English', 'negative', 0, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop', now() - interval '15 days', now() - interval '12 days'),
  ('CMP10010', 'Drainage overflow on 5th street. Dirty water entering homes.', 'Sanitation', 'Sanitation Department', 'High', 'In Progress', '5th Street, Lakshmi Nagar', 'English', 'urgent', 3, 'https://images.unsplash.com/photo-1500333186434-7b646d53b006?w=800&auto=format&fit=crop', now() - interval '4 hours', NULL),
  ('CMP10011', 'No water supply in our area for 2 days. Please help.', 'Water Supply', 'Water Department', 'High', 'Registered', 'Shastri Nagar, Block A', 'Hindi', 'negative', 0, 'https://images.unsplash.com/photo-1473081556163-2a17de81fc97?w=800&auto=format&fit=crop', now() - interval '2 hours', NULL),
  ('CMP10012', 'Traffic signal not working at the main junction. Accidents happening.', 'Public Safety', 'Police Department', 'Critical', 'Assigned', 'Main Junction, City Center', 'English', 'urgent', 0, 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=800&auto=format&fit=crop', now() - interval '1 hour', NULL)
ON CONFLICT (ticket_id) DO NOTHING;

-- Mark duplicates: CMP10002 is a duplicate of CMP10001, CMP10010 has 3 matching reports
UPDATE complaints SET duplicate_of = (SELECT id FROM complaints WHERE ticket_id = 'CMP10001') WHERE ticket_id = 'CMP10002';
