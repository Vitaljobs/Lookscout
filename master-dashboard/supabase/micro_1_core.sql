CREATE TABLE projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE, description text, status text NOT NULL DEFAULT 'operational', health integer DEFAULT 100, last_updated timestamptz DEFAULT now(), url text, public_url text, theme text DEFAULT 'blue');

CREATE TABLE stats (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), total_users integer DEFAULT 0, active_now integer DEFAULT 0, page_views_24h integer DEFAULT 0, popular_lab text, updated_at timestamptz DEFAULT now());

CREATE TABLE profiles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, full_name text, role text DEFAULT 'user', created_at timestamptz DEFAULT now());