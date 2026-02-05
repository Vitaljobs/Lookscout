-- ============================================================================
-- PRE-MIGRATIE: Fix alerts table type mismatch
-- ============================================================================
-- De alerts tabel heeft project_id als TEXT, maar moet UUID zijn voor foreign key

-- Step 1: Rename old column
ALTER TABLE alerts RENAME COLUMN project_id TO project_slug_old;

-- Step 2: Add new UUID column
ALTER TABLE alerts ADD COLUMN project_id uuid;

-- Step 3: Migrate data from slug to UUID
UPDATE alerts a
SET project_id = p.id
FROM projects p
WHERE p.slug = a.project_slug_old;

-- Step 4: Handle any remaining NULL values (fallback to Lookscout)
UPDATE alerts
SET project_id = (SELECT id FROM projects WHERE slug = 'lookscout' LIMIT 1)
WHERE project_id IS NULL;

-- Step 5: Make NOT NULL
ALTER TABLE alerts ALTER COLUMN project_id SET NOT NULL;

-- Step 6: Drop old column
ALTER TABLE alerts DROP COLUMN project_slug_old;

-- Step 7: Add index
CREATE INDEX IF NOT EXISTS idx_alerts_project_id ON alerts(project_id);

COMMENT ON COLUMN alerts.project_id IS 'Foreign key to projects table (converted from text slug to uuid)';
