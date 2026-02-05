-- ============================================================================
-- BALORIA PROJECT ACTIVATIE
-- ============================================================================
-- Voegt Baloria toe aan het Master Dashboard ecosysteem

-- Baloria Project Registratie
INSERT INTO projects (slug, name, description, domain, status, created_at)
VALUES (
  'baloria',
  'Baloria',
  'Sociaal platform met visuele ballebak voor vragen, kansen en connecties',
  'baloria.nl',
  'active',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  domain = EXCLUDED.domain,
  status = EXCLUDED.status;

-- Grant Overlord Access voor James
INSERT INTO user_project_access (user_id, project_id, role)
SELECT 
  'e8198878-31fb-4c2b-89f7-425849abd945'::uuid,
  id,
  'owner'
FROM projects
WHERE slug = 'baloria'
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Baloria-specifieke tabellen voor tracking
CREATE TABLE IF NOT EXISTS baloria_balls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ball_type text NOT NULL CHECK (ball_type IN ('question', 'vacancy', 'housing', 'education', 'collaboration')),
  color text NOT NULL, -- Hex color code
  theme text NOT NULL, -- Relaties, Werk, Financiën, etc.
  title text NOT NULL,
  description text,
  creator_id uuid, -- Kan NULL zijn voor anonieme vragen
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'caught', 'expired', 'closed')),
  filters jsonb, -- Filters voor wie mag antwoorden
  commitment_minutes integer DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  caught_at timestamptz,
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS baloria_catches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ball_id uuid NOT NULL REFERENCES baloria_balls(id) ON DELETE CASCADE,
  catcher_id uuid NOT NULL, -- User die de bal vangt
  answer text NOT NULL,
  commitment_started_at timestamptz DEFAULT now(),
  commitment_ended_at timestamptz,
  is_anonymous boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_baloria_balls_project_id ON baloria_balls(project_id);
CREATE INDEX IF NOT EXISTS idx_baloria_balls_status ON baloria_balls(status);
CREATE INDEX IF NOT EXISTS idx_baloria_balls_ball_type ON baloria_balls(ball_type);
CREATE INDEX IF NOT EXISTS idx_baloria_catches_ball_id ON baloria_catches(ball_id);

-- RLS Policies voor Baloria tabellen
ALTER TABLE baloria_balls ENABLE ROW LEVEL SECURITY;
ALTER TABLE baloria_catches ENABLE ROW LEVEL SECURITY;

-- Overlord ziet alles
CREATE POLICY "Overlord sees all balls"
  ON baloria_balls FOR ALL
  TO authenticated
  USING (auth.uid() = 'e8198878-31fb-4c2b-89f7-425849abd945'::uuid);

CREATE POLICY "Overlord sees all catches"
  ON baloria_catches FOR ALL
  TO authenticated
  USING (auth.uid() = 'e8198878-31fb-4c2b-89f7-425849abd945'::uuid);

-- Public kan actieve ballen zien
CREATE POLICY "Public can view active balls"
  ON baloria_balls FOR SELECT
  TO authenticated, anon
  USING (status = 'active');

-- Users kunnen hun eigen catches zien
CREATE POLICY "Users see own catches"
  ON baloria_catches FOR SELECT
  TO authenticated
  USING (catcher_id = auth.uid());

-- Verification
DO $$
DECLARE
  baloria_id uuid;
BEGIN
  SELECT id INTO baloria_id FROM projects WHERE slug = 'baloria';
  RAISE NOTICE 'Baloria project geactiveerd met ID: %', baloria_id;
  RAISE NOTICE 'Baloria tracking tabellen aangemaakt';
  RAISE NOTICE 'Overlord access verleend aan James';
END $$;
