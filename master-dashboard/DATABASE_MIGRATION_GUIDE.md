# 🚀 Master Database Consolidatie - Deployment Guide

## Stap 1: Database Migraties Uitvoeren (5 minuten)

### Open Supabase SQL Editor

1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard/project/cwhcxazrmayjhaadtjqs/sql/new)
2. Log in en selecteer je **Lookscout** project

### Migratie 1: Project ID Systeem

**Kopieer en plak deze SQL:**

```sql
-- Master Database Consolidation: Add project_id to all shared tables
-- This migration adds project_id foreign keys to enable strict data isolation

-- Step 1: Add project_id columns (nullable first for data migration)
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS project_id uuid;

-- Step 2: Create project lookup function for migration
CREATE OR REPLACE FUNCTION get_project_id_by_slug(slug_param text)
RETURNS uuid AS $$
  SELECT id FROM projects WHERE slug = slug_param LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Step 3: Migrate existing data
UPDATE contact_messages cm
SET project_id = get_project_id_by_slug(cm.project_source)
WHERE project_id IS NULL AND project_source IS NOT NULL;

UPDATE security_events se
SET project_id = get_project_id_by_slug(se.project_source)
WHERE project_id IS NULL AND project_source IS NOT NULL;

UPDATE alerts a
SET project_id = (
  CASE 
    WHEN a.type LIKE '%vibechain%' OR a.type LIKE '%echo%' THEN get_project_id_by_slug('echo-chamber')
    WHEN a.type LIKE '%vitaljobs%' THEN get_project_id_by_slug('vitaljobs')
    WHEN a.type LIKE '%commonground%' THEN get_project_id_by_slug('commonground')
    ELSE get_project_id_by_slug('lookscout')
  END
)
WHERE project_id IS NULL;

-- Step 4: Make project_id NOT NULL and add foreign keys
ALTER TABLE contact_messages 
  ALTER COLUMN project_id SET NOT NULL,
  ADD CONSTRAINT fk_contact_messages_project 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE security_events 
  ALTER COLUMN project_id SET NOT NULL,
  ADD CONSTRAINT fk_security_events_project 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE alerts 
  ALTER COLUMN project_id SET NOT NULL,
  ADD CONSTRAINT fk_alerts_project 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_project_id ON contact_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_security_events_project_id ON security_events(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_project_id ON alerts(project_id);

-- Step 6: Keep project_source for backwards compatibility
COMMENT ON COLUMN contact_messages.project_source IS 'Legacy slug field, use project_id for queries';
COMMENT ON COLUMN security_events.project_source IS 'Legacy slug field, use project_id for queries';
```

**Klik Run** → Verwacht: "Success. No rows returned"

---

### Migratie 2: User Project Access

**Nieuwe query, kopieer en plak:**

```sql
-- Master Database Consolidation: User Project Access Control

CREATE TABLE IF NOT EXISTS user_project_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_project_access_user ON user_project_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_access_project ON user_project_access(project_id);
CREATE INDEX IF NOT EXISTS idx_user_project_access_role ON user_project_access(role);

ALTER TABLE user_project_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own access"
  ON user_project_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Overlord sees all access"
  ON user_project_access FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Give James owner access to all projects
INSERT INTO user_project_access (user_id, project_id, role)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'james@live.nl' LIMIT 1),
  id,
  'owner'
FROM projects
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Helper functions
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

CREATE OR REPLACE FUNCTION get_user_project_ids(user_id_param uuid)
RETURNS TABLE(project_id uuid) AS $$
  SELECT project_id 
  FROM user_project_access 
  WHERE user_id = user_id_param;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

**Klik Run** → Verwacht: "Success. No rows returned"

---

### Migratie 3: RLS Policies (BELANGRIJK!)

**Nieuwe query, kopieer en plak:**

```sql
-- Master Database Consolidation: Row Level Security Policies

-- ============================================================================
-- CONTACT MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated read access" ON contact_messages;
DROP POLICY IF EXISTS "Allow service role insert" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated update" ON contact_messages;
DROP POLICY IF EXISTS "Allow anonymous insert for webhook" ON contact_messages;

CREATE POLICY "Overlord sees all messages"
  ON contact_messages FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

CREATE POLICY "Project isolation for messages"
  ON contact_messages FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Webhook can insert messages"
  ON contact_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role full access messages"
  ON contact_messages FOR ALL
  TO service_role
  USING (true);

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
-- SECURITY EVENTS
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated read security events" ON security_events;
DROP POLICY IF EXISTS "Allow service role insert security events" ON security_events;

CREATE POLICY "Overlord sees all security events"
  ON security_events FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

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

CREATE POLICY "Service role full access security events"
  ON security_events FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- ALERTS
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated read alerts" ON alerts;

CREATE POLICY "Overlord sees all alerts"
  ON alerts FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

CREATE POLICY "Project isolation for alerts"
  ON alerts FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access alerts"
  ON alerts FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- PROJECTS
-- ============================================================================

DROP POLICY IF EXISTS "Allow public read access projects" ON projects;
DROP POLICY IF EXISTS "Allow service role full access projects" ON projects;

CREATE POLICY "Public can read projects"
  ON projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Overlord manages projects"
  ON projects FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

CREATE POLICY "Service role full access projects"
  ON projects FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW user_projects AS
SELECT 
  upa.user_id,
  upa.role,
  p.*
FROM user_project_access upa
JOIN projects p ON p.id = upa.project_id;

GRANT SELECT ON user_projects TO authenticated;
```

**Klik Run** → Verwacht: "Success. No rows returned"

---

## Stap 2: Verificatie (2 minuten)

### Check 1: Project IDs zijn toegevoegd

```sql
SELECT 
  cm.id,
  cm.subject,
  cm.project_source,
  cm.project_id,
  p.name as project_name
FROM contact_messages cm
LEFT JOIN projects p ON p.id = cm.project_id
LIMIT 5;
```

Verwacht: Elke row heeft een `project_id` en `project_name`

### Check 2: James heeft Overlord access

```sql
SELECT 
  u.email,
  p.name as project,
  upa.role
FROM user_project_access upa
JOIN auth.users u ON u.id = upa.user_id
JOIN projects p ON p.id = upa.project_id
WHERE u.email = 'james@live.nl';
```

Verwacht: 4 rows (één voor elk project) met role = 'owner'

### Check 3: RLS werkt

```sql
-- Als James, zie je alles
SELECT count(*) FROM contact_messages;

-- Test dat policies actief zijn
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('contact_messages', 'security_events', 'alerts')
ORDER BY tablename, policyname;
```

Verwacht: Meerdere policies per tabel

---

## Stap 3: Code Updates (volgende fase)

Na succesvolle database migratie moeten we de code updaten:

1. ✅ `emailAnalyzer.ts` - Return project_id
2. ✅ `app/api/support/incoming/route.ts` - Insert met project_id
3. ✅ `components/SupportHub.tsx` - Filter op project_id
4. ✅ Types updaten

Dit doen we in de volgende stap!

---

## Troubleshooting

### Error: "column project_id already exists"

Betekent dat migratie al is uitgevoerd. Skip naar volgende migratie.

### Error: "relation user_project_access already exists"

Skip naar migratie 3 (RLS policies).

### Error: "user not found"

Je moet eerst inloggen in de app zodat je user account wordt aangemaakt.

---

## Rollback (als nodig)

```sql
-- Verwijder constraints
ALTER TABLE contact_messages DROP CONSTRAINT IF EXISTS fk_contact_messages_project;
ALTER TABLE security_events DROP CONSTRAINT IF EXISTS fk_security_events_project;
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS fk_alerts_project;

-- Verwijder kolommen
ALTER TABLE contact_messages DROP COLUMN IF EXISTS project_id;
ALTER TABLE security_events DROP COLUMN IF EXISTS project_id;
ALTER TABLE alerts DROP COLUMN IF EXISTS project_id;

-- Drop tabel
DROP TABLE IF EXISTS user_project_access CASCADE;
```

---

**Klaar? Ga door naar code updates!** 🚀
