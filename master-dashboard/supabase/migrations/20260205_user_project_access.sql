-- ============================================================================
-- MIGRATIE 2: User Project Access Control
-- ============================================================================
-- Tabel voor het beheren van welke users toegang hebben tot welke projecten

CREATE TABLE IF NOT EXISTS user_project_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_project_access_user ON user_project_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_access_project ON user_project_access(project_id);
CREATE INDEX IF NOT EXISTS idx_user_project_access_role ON user_project_access(role);

-- Enable RLS
ALTER TABLE user_project_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own access
CREATE POLICY "Users see own access"
  ON user_project_access FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Overlord (James) sees all access
CREATE POLICY "Overlord sees all access"
  ON user_project_access FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Seed data: Give James (Overlord) owner access to all projects
INSERT INTO user_project_access (user_id, project_id, role)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'james@live.nl' LIMIT 1),
  id,
  'owner'
FROM projects
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Function to check if user has access to project
CREATE OR REPLACE FUNCTION user_has_project_access(
  user_id_param uuid,
  project_id_param uuid
)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_project_access 
    WHERE user_id = user_id_param 
      AND project_id = project_id_param
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to get user's accessible project IDs
CREATE OR REPLACE FUNCTION get_user_project_ids(user_id_param uuid)
RETURNS TABLE(project_id uuid) AS $$
  SELECT project_id 
  FROM user_project_access 
  WHERE user_id = user_id_param;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
