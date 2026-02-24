-- De allerlaatste finishing touches voor Lookscout

-- 1. Fix Baztion Metrics (voeg project_id toe)
ALTER TABLE baztion_metrics ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);

-- 2. Maak Baloria tabellen aan als ze er nog niet zijn
-- De code zoekt specifiek naar deze namen
CREATE TABLE IF NOT EXISTS baloria_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ball_type text NOT NULL,
  color text NOT NULL,
  theme text NOT NULL,
  title text NOT NULL,
  description text,
  creator_id uuid,
  status text NOT NULL DEFAULT 'open',
  filters jsonb,
  commitment_minutes integer DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  caught_at timestamptz,
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS baloria_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES baloria_questions(id) ON DELETE CASCADE,
  catcher_id uuid NOT NULL,
  answer text NOT NULL,
  commitment_started_at timestamptz DEFAULT now(),
  commitment_ended_at timestamptz,
  is_anonymous boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Toegangscontrole tabel (voor de zekerheid nogmaals)
CREATE TABLE IF NOT EXISTS user_project_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- 4. Enable RLS en Policies voor deze tabellen
ALTER TABLE baztion_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE baloria_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baloria_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all baztion_metrics_final" ON baztion_metrics FOR ALL USING (true);
CREATE POLICY "Allow all baloria_questions_final" ON baloria_questions FOR ALL USING (true);
CREATE POLICY "Allow all baloria_answers_final" ON baloria_answers FOR ALL USING (true);
CREATE POLICY "Allow all user_project_access_final" ON user_project_access FOR ALL USING (true);

-- 5. Seed data voor Baztion (zodat er direct iets te zien is)
INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT id, 'culture_score', 82, 82, 'up' FROM projects WHERE slug = 'baztion'
LIMIT 1;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT id, 'active_users', 145, NULL, 'up' FROM projects WHERE slug = 'baztion'
LIMIT 1;
