-- ============================================================================
-- BAZTION (SIGNAL) PROJECT ACTIVATIE
-- ============================================================================
-- Voegt Baztion toe aan het Master Dashboard ecosysteem

-- Baztion Project Registratie
INSERT INTO projects (slug, name, status)
VALUES (
  'baztion',
  'Baztion (Signal)',
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- Grant Overlord Access voor James
INSERT INTO user_project_access (user_id, project_id, role)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'james@live.nl' LIMIT 1),
  id,
  'owner'
FROM projects
WHERE slug = 'baztion'
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Baztion-specifieke tabellen voor tracking
CREATE TABLE IF NOT EXISTS baztion_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN ('culture_score', 'active_users', 'feedback_items', 'engagement', 'psychological_safety', 'open_communication', 'team_trust', 'inclusivity')),
  value numeric NOT NULL,
  percentage numeric, -- Voor percentage metrics
  trend text CHECK (trend IN ('up', 'down', 'stable')),
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS baztion_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  post_type text NOT NULL CHECK (post_type IN ('connect', 'signal')),
  is_anonymous boolean DEFAULT false,
  content text NOT NULL,
  author_id uuid, -- NULL voor anonieme posts
  category text, -- Voor Signal mode: suggestion, concern, idea, question
  status text DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'implemented', 'closed')),
  upvotes integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS baztion_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('anonymous', 'open')),
  content text NOT NULL,
  author_id uuid, -- NULL voor anonieme feedback
  target_user_id uuid, -- Voor wie is de feedback
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_baztion_metrics_project_id ON baztion_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_baztion_metrics_type ON baztion_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_baztion_posts_project_id ON baztion_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_baztion_posts_type ON baztion_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_baztion_feedback_project_id ON baztion_feedback(project_id);

-- RLS Policies voor Baztion tabellen
ALTER TABLE baztion_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE baztion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE baztion_feedback ENABLE ROW LEVEL SECURITY;

-- Overlord ziet alles
CREATE POLICY "Overlord sees all baztion metrics"
  ON baztion_metrics FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'james@live.nl'));

CREATE POLICY "Overlord sees all baztion posts"
  ON baztion_posts FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'james@live.nl'));

CREATE POLICY "Overlord sees all baztion feedback"
  ON baztion_feedback FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'james@live.nl'));

-- Authenticated users kunnen metrics lezen
CREATE POLICY "Authenticated read baztion metrics"
  ON baztion_metrics FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users kunnen posts lezen
CREATE POLICY "Authenticated read baztion posts"
  ON baztion_posts FOR SELECT
  TO authenticated
  USING (true);

-- Seed initial metrics (voorbeeld data van je screenshots)
INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'culture_score',
  78,
  NULL,
  'stable'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'active_users',
  124,
  NULL,
  'up'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'feedback_items',
  47,
  NULL,
  'stable'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'engagement',
  89,
  89,
  'up'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'psychological_safety',
  78,
  78,
  'stable'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'open_communication',
  72,
  72,
  'up'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'team_trust',
  85,
  85,
  'up'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'inclusivity',
  80,
  80,
  'stable'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

-- Verification
DO $$
DECLARE
  baztion_id uuid;
BEGIN
  SELECT id INTO baztion_id FROM projects WHERE slug = 'baztion';
  RAISE NOTICE '✅ Baztion project geactiveerd met ID: %', baztion_id;
  RAISE NOTICE '✅ Baztion tracking tabellen aangemaakt';
  RAISE NOTICE '✅ Overlord access verleend aan James';
  RAISE NOTICE '✅ Initial metrics geseeded';
END $$;
