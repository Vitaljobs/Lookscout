-- Core Table Policies
CREATE POLICY "Allow all projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all stats" ON stats FOR ALL USING (true);
CREATE POLICY "Allow all profiles" ON profiles FOR ALL USING (true);

-- Security Table Policies
CREATE POLICY "Allow all security_events" ON security_events FOR ALL USING (true);
CREATE POLICY "Allow all blocked_ips" ON blocked_ips FOR ALL USING (true);
