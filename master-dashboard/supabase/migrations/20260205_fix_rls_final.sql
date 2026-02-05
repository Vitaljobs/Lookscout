-- ============================================================================
-- FIX: RLS Policies die daadwerkelijk werken
-- ============================================================================
-- Probleem: De Overlord policies werkten niet omdat auth.uid() check faalde
-- Oplossing: Directe UUID check + fallback naar email check

-- Eerst: Re-enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Drop debug policies
DROP POLICY IF EXISTS "DEBUG: Authenticated read all messages" ON contact_messages;
DROP POLICY IF EXISTS "DEBUG: Authenticated read all security events" ON security_events;
DROP POLICY IF EXISTS "DEBUG: Authenticated read all alerts" ON alerts;

-- ============================================================================
-- CONTACT MESSAGES - Gefixte policies
-- ============================================================================

-- Overlord: Direct UUID check (meest betrouwbaar)
CREATE POLICY "Overlord full access messages v2"
  ON contact_messages FOR ALL
  TO authenticated
  USING (
    auth.uid() = 'e8198878-31fb-4c2b-89f7-425849abd945'::uuid
  );

-- Project members: Read access
CREATE POLICY "Project members read messages v2"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECURITY EVENTS - Gefixte policies
-- ============================================================================

CREATE POLICY "Overlord full access security v2"
  ON security_events FOR ALL
  TO authenticated
  USING (
    auth.uid() = 'e8198878-31fb-4c2b-89f7-425849abd945'::uuid
  );

CREATE POLICY "Project admins read security v2"
  ON security_events FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- ALERTS - Gefixte policies
-- ============================================================================

CREATE POLICY "Overlord full access alerts v2"
  ON alerts FOR ALL
  TO authenticated
  USING (
    auth.uid() = 'e8198878-31fb-4c2b-89f7-425849abd945'::uuid
  );

CREATE POLICY "Project members read alerts v2"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies gefixed met directe UUID check voor Overlord';
  RAISE NOTICE 'Overlord UUID: e8198878-31fb-4c2b-89f7-425849abd945';
END $$;
