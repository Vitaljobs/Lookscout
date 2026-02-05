-- ============================================================================
-- MIGRATIE 3: Row Level Security Policies (FIXED VERSION)
-- ============================================================================
-- Implementeert strikte data isolatie met Overlord access voor James

-- ============================================================================
-- CONTACT MESSAGES - Support Hub
-- ============================================================================

-- Drop ALL existing policies (including old ones)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contact_messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON contact_messages';
    END LOOP;
END $$;

-- Overlord Policy: James sees everything
CREATE POLICY "Overlord sees all messages"
  ON contact_messages FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Project Isolation: Users see only their project's messages
CREATE POLICY "Project isolation for messages"
  ON contact_messages FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

-- Webhook Insert: Anonymous can insert (for email webhook)
CREATE POLICY "Webhook can insert messages"
  ON contact_messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service Role: Full access for backend operations
CREATE POLICY "Service role full access messages"
  ON contact_messages FOR ALL
  TO service_role
  USING (true);

-- Users can update messages in their projects
CREATE POLICY "Users update own project messages"
  ON contact_messages FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
    )
  );

-- ============================================================================
-- SECURITY EVENTS - Lockout Scout
-- ============================================================================

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'security_events') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON security_events';
    END LOOP;
END $$;

-- Overlord Policy
CREATE POLICY "Overlord sees all security events"
  ON security_events FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Project Isolation
CREATE POLICY "Project isolation for security events"
  ON security_events FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Service Role
CREATE POLICY "Service role full access security events"
  ON security_events FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- ALERTS - System Alerts
-- ============================================================================

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'alerts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON alerts';
    END LOOP;
END $$;

-- Overlord Policy
CREATE POLICY "Overlord sees all alerts"
  ON alerts FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Project Isolation
CREATE POLICY "Project isolation for alerts"
  ON alerts FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

-- Service Role
CREATE POLICY "Service role full access alerts"
  ON alerts FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- PROJECTS - Project Registry
-- ============================================================================

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON projects';
    END LOOP;
END $$;

-- Public Read
CREATE POLICY "Public can read projects"
  ON projects FOR SELECT
  TO anon, authenticated
  USING (true);

-- Overlord can do everything
CREATE POLICY "Overlord manages projects"
  ON projects FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Service Role
CREATE POLICY "Service role full access projects"
  ON projects FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- Drop view if exists
DROP VIEW IF EXISTS user_projects;

-- View: User's accessible projects with details
CREATE VIEW user_projects AS
SELECT 
  upa.user_id,
  upa.role,
  p.*
FROM user_project_access upa
JOIN projects p ON p.id = upa.project_id;

-- Grant access to view
GRANT SELECT ON user_projects TO authenticated;
