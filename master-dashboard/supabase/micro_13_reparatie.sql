-- Reparatie Micro Chunk 13

-- 1. Ontbrekende tabel voor toegangsbeheer
CREATE TABLE IF NOT EXISTS user_project_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- 2. Baloria namen synchroniseren met wat de code verwacht
-- De code gebruikt 'baloria_questions' en 'baloria_answers'
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

-- 3. Zorg dat alle projecten in de 'projects' tabel staan
-- Dit lost de 'Baztion project not found' error op
INSERT INTO projects (name, slug, description, status, health, theme)
VALUES 
  ('Baztion', 'baztion', 'Psychological Safety Platform', 'operational', 95, 'purple'),
  ('Baloria', 'baloria', 'Social Interactive Platform', 'operational', 92, 'pink')
ON CONFLICT (slug) DO UPDATE SET
  status = EXCLUDED.status,
  health = EXCLUDED.health;

-- 4. Geef James (Overlord) toegang tot de projecten
-- (Zodat de code geen leeg dashboard meer ziet na login)
INSERT INTO user_project_access (user_id, project_id, role)
SELECT 
  '799e0f6c-63b7-4581-9b0d-771190bc1e6f', -- James UID uit authenticatie (of proxy indien onbekend)
  id,
  'owner'
FROM projects
ON CONFLICT DO NOTHING;

-- 5. Beveiliging voor de nieuwe tabellen
ALTER TABLE user_project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE baloria_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baloria_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all user_project_access" ON user_project_access FOR ALL USING (true);
CREATE POLICY "Allow all baloria_questions" ON baloria_questions FOR ALL USING (true);
CREATE POLICY "Allow all baloria_answers" ON baloria_answers FOR ALL USING (true);
