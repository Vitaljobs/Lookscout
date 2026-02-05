-- ============================================================================
-- MIGRATIE 1: Project ID Systeem (FIXED - Type safe version)
-- ============================================================================
-- Voeg project_id kolommen toe aan gedeelde tabellen
-- NOTE: Run 20260205_fix_alerts_type.sql FIRST!

-- Step 1: Add project_id columns (nullable first for data migration)
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS project_id uuid;
-- alerts already has project_id as uuid from pre-migration

-- Step 2: Create project lookup function for migration
CREATE OR REPLACE FUNCTION get_project_id_by_slug(slug_param text)
RETURNS uuid AS $$
  SELECT id FROM projects WHERE slug = slug_param LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Step 3: Get default project ID (Lookscout) for fallback
DO $$
DECLARE
  default_project_id uuid;
BEGIN
  -- Get Lookscout project ID as default
  SELECT id INTO default_project_id FROM projects WHERE slug = 'lookscout' LIMIT 1;
  
  -- If no Lookscout, use first project
  IF default_project_id IS NULL THEN
    SELECT id INTO default_project_id FROM projects LIMIT 1;
  END IF;

  -- Migrate contact_messages
  UPDATE contact_messages cm
  SET project_id = COALESCE(
    get_project_id_by_slug(cm.project_source),
    default_project_id
  )
  WHERE project_id IS NULL;

  -- Migrate security_events (use project_source or default to Lookscout)
  UPDATE security_events se
  SET project_id = COALESCE(
    get_project_id_by_slug(se.project_source),
    default_project_id
  )
  WHERE project_id IS NULL;
END $$;

-- Step 4: Verify no NULL values remain
DO $$
DECLARE
  null_count integer;
BEGIN
  -- Check contact_messages
  SELECT COUNT(*) INTO null_count FROM contact_messages WHERE project_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'contact_messages still has % NULL project_id values', null_count;
  END IF;

  -- Check security_events
  SELECT COUNT(*) INTO null_count FROM security_events WHERE project_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'security_events still has % NULL project_id values', null_count;
  END IF;

  -- Check alerts
  SELECT COUNT(*) INTO null_count FROM alerts WHERE project_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'alerts still has % NULL project_id values', null_count;
  END IF;
END $$;

-- Step 5: Make project_id NOT NULL and add foreign keys
DO $$ 
BEGIN
  -- contact_messages
  ALTER TABLE contact_messages ALTER COLUMN project_id SET NOT NULL;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_contact_messages_project'
  ) THEN
    ALTER TABLE contact_messages 
      ADD CONSTRAINT fk_contact_messages_project 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- security_events
  ALTER TABLE security_events ALTER COLUMN project_id SET NOT NULL;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_security_events_project'
  ) THEN
    ALTER TABLE security_events 
      ADD CONSTRAINT fk_security_events_project 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- alerts (already has NOT NULL from pre-migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_alerts_project'
  ) THEN
    ALTER TABLE alerts 
      ADD CONSTRAINT fk_alerts_project 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_project_id ON contact_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_security_events_project_id ON security_events(project_id);
-- alerts index already created in pre-migration

-- Step 7: Keep project_source for backwards compatibility
COMMENT ON COLUMN contact_messages.project_source IS 'Legacy slug field, use project_id for queries';
COMMENT ON COLUMN security_events.project_source IS 'Legacy slug field, use project_id for queries';
