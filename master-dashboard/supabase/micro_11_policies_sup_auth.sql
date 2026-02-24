-- Support Table Policies
CREATE POLICY "Allow all external_sites" ON external_sites FOR ALL USING (true);
CREATE POLICY "Allow all support_messages" ON support_messages FOR ALL USING (true);
CREATE POLICY "Allow all contact_messages" ON contact_messages FOR ALL USING (true);

-- Auth & Health Table Policies
CREATE POLICY "Allow all user_credentials" ON user_credentials FOR ALL USING (true);
CREATE POLICY "Allow all face_profiles" ON face_profiles FOR ALL USING (true);
CREATE POLICY "Allow all project_health_logs" ON project_health_logs FOR ALL USING (true);
CREATE POLICY "Allow all alerts" ON alerts FOR ALL USING (true);
