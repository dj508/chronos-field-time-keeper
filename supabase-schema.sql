-- =====================================================
-- Supabase Database Schema for Chronos & ZenTask
-- =====================================================
-- Project URLs: https://dqorzhjmfzkxcltradgk.supabase.co
-- Created: 2025
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CHRONOS FIELD TIMEKEEPER TABLES
-- =====================================================

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    representative TEXT,
    address TEXT,
    contact TEXT,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table (assets/equipment at customer sites)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Serial Number / Tag
    mc_make TEXT,
    mc_type TEXT,
    year_of_mfg TEXT,
    running_hours TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table (predefined task templates)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Types table
CREATE TABLE IF NOT EXISTS activity_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Entries table (main work session records)
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
    technician_name TEXT,
    technician_email TEXT,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    is_synced BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entry Steps table (individual steps within a time entry)
CREATE TABLE IF NOT EXISTS entry_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activity_types(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    step_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ZENTASK AI REMINDER TABLES
-- =====================================================

-- Tasks table for ZenTask
CREATE TABLE IF NOT EXISTS zentask_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT NOT NULL CHECK (category IN ('Work', 'Personal', 'Home', 'Health', 'Finance', 'Other')),
    completed BOOLEAN DEFAULT FALSE,
    reminder_offset INTEGER, -- minutes before due date, NULL means use global default
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder Settings table
CREATE TABLE IF NOT EXISTS reminder_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    lead_time_minutes INTEGER DEFAULT 15,
    sound_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Chronos indexes
CREATE INDEX IF NOT EXISTS idx_technicians_email ON technicians(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_customer_id ON time_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_technician_id ON time_entries(technician_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_check_in ON time_entries(check_in);
CREATE INDEX IF NOT EXISTS idx_entry_steps_time_entry_id ON entry_steps(time_entry_id);

-- ZenTask indexes
CREATE INDEX IF NOT EXISTS idx_zentask_items_due_date ON zentask_items(due_date);
CREATE INDEX IF NOT EXISTS idx_zentask_items_priority ON zentask_items(priority);
CREATE INDEX IF NOT EXISTS idx_zentask_items_category ON zentask_items(category);
CREATE INDEX IF NOT EXISTS idx_zentask_items_completed ON zentask_items(completed);
CREATE INDEX IF NOT EXISTS idx_zentask_items_user_id ON zentask_items(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE zentask_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;

-- Technicians policies
CREATE POLICY "Technicians are viewable by authenticated users"
    ON technicians FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Technicians can be inserted by authenticated users"
    ON technicians FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Technicians can be updated by authenticated users"
    ON technicians FOR UPDATE
    TO authenticated
    USING (true);

-- Customers policies
CREATE POLICY "Customers are viewable by authenticated users"
    ON customers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Customers can be managed by authenticated users"
    ON customers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Projects policies
CREATE POLICY "Projects are viewable by authenticated users"
    ON projects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Projects can be managed by authenticated users"
    ON projects FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Tasks policies
CREATE POLICY "Tasks are viewable by authenticated users"
    ON tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Tasks can be managed by authenticated users"
    ON tasks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Activity Types policies
CREATE POLICY "Activity types are viewable by authenticated users"
    ON activity_types FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Activity types can be managed by authenticated users"
    ON activity_types FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Time Entries policies
CREATE POLICY "Time entries are viewable by authenticated users"
    ON time_entries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Time entries can be managed by authenticated users"
    ON time_entries FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Entry Steps policies
CREATE POLICY "Entry steps are viewable by authenticated users"
    ON entry_steps FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Entry steps can be managed by authenticated users"
    ON entry_steps FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ZenTask Items policies
CREATE POLICY "Users can view their own tasks"
    ON zentask_items FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own tasks"
    ON zentask_items FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own tasks"
    ON zentask_items FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own tasks"
    ON zentask_items FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Reminder Settings policies
CREATE POLICY "Users can view their own settings"
    ON reminder_settings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON reminder_settings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON reminder_settings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_technicians_updated_at
    BEFORE UPDATE ON technicians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_types_updated_at
    BEFORE UPDATE ON activity_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zentask_items_updated_at
    BEFORE UPDATE ON zentask_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_settings_updated_at
    BEFORE UPDATE ON reminder_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA (OPTIONAL)
-- =====================================================

-- Insert sample activity types for Chronos
INSERT INTO activity_types (name, color) VALUES
    ('Travel', '#3B82F6'),
    ('Diagnosis', '#8B5CF6'),
    ('Repair', '#EC4899'),
    ('Maintenance', '#10B981'),
    ('Testing', '#F59E0B'),
    ('Documentation', '#6B7280')
ON CONFLICT DO NOTHING;

-- Insert sample tasks for Chronos
INSERT INTO tasks (name, description) VALUES
    ('Initial Inspection', 'Perform initial equipment inspection'),
    ('Parts Replacement', 'Replace faulty or worn parts'),
    ('System Testing', 'Test system functionality after repair'),
    ('Customer Briefing', 'Brief customer on work performed')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCTIONS FOR STATISTICS
-- =====================================================

-- Function to get task statistics for ZenTask
CREATE OR REPLACE FUNCTION get_zentask_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    completed BIGINT,
    pending BIGINT,
    by_category JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE completed = TRUE)::BIGINT AS completed,
        COUNT(*) FILTER (WHERE completed = FALSE)::BIGINT AS pending,
        COALESCE(
            jsonb_agg(
                jsonb_build_object('name', category, 'count', cnt)
            ) FILTER (WHERE category IS NOT NULL),
            '[]'::jsonb
        ) AS by_category
    FROM (
        SELECT category, COUNT(*) as cnt
        FROM zentask_items
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND completed = FALSE
        GROUP BY category
    ) sub;
END;
$$ LANGUAGE plpgsql;

-- Function to get time entry statistics for Chronos
CREATE OR REPLACE FUNCTION get_chronos_stats(
    p_customer_id UUID DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_entries BIGINT,
    total_hours NUMERIC,
    active_entries BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_entries,
        COALESCE(
            SUM(
                EXTRACT(EPOCH FROM (
                    COALESCE(check_out, NOW()) - check_in
                )) / 3600.0
            ),
            0
        )::NUMERIC AS total_hours,
        COUNT(*) FILTER (WHERE check_out IS NULL)::BIGINT AS active_entries
    FROM time_entries
    WHERE (p_customer_id IS NULL OR customer_id = p_customer_id)
    AND (p_start_date IS NULL OR check_in >= p_start_date)
    AND (p_end_date IS NULL OR check_in <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Database schema successfully created!
-- 
-- Next steps:
-- 1. Run this script in your Supabase SQL Editor
-- 2. Configure your application to use the Supabase client
-- 3. Test authentication and data operations
-- =====================================================
