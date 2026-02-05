-- ============================================================================
-- DEBUG: Tijdelijk permissieve RLS voor troubleshooting
-- ============================================================================
-- Dit maakt RLS tijdelijk permissief zodat we kunnen zien wat er mis gaat

-- Tijdelijk: Authenticated users kunnen alles lezen
CREATE POLICY "DEBUG: Authenticated read all messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "DEBUG: Authenticated read all security events"
  ON security_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "DEBUG: Authenticated read all alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);

-- Log voor debugging
DO $$
BEGIN
  RAISE NOTICE 'DEBUG RLS policies toegevoegd - alle authenticated users kunnen nu lezen';
END $$;
