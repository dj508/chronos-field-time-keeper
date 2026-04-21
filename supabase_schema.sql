-- ============================================
-- SUPABASE SCHEMA FOR CHRONOS & ZENTASK
-- ============================================
-- Copy this entire script and paste it into the Supabase SQL Editor
-- Then click "Run" to execute
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CHRONOS FIELD TIMEKEEPER TABLES
-- ============================================

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    equipment_type VARCHAR(100),
    model_number VARCHAR(100),
    serial_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (templates for work items)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    estimated_duration INTEGER DEFAULT 0, -- in minutes
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to UUID REFERENCES technicians(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Types table
CREATE TABLE IF NOT EXISTS activity_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_billable BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    activity_type_id UUID REFERENCES activity_types(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    notes TEXT,
    is_break BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entry Steps table (individual steps within a time entry)
CREATE TABLE IF NOT EXISTS entry_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ZENTASK AI REMINDER TABLES
-- ============================================

-- ZenTask Items table
CREATE TABLE IF NOT EXISTS zentask_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reminder_enabled BOOLEAN DEFAULT false,
    reminder_minutes_before INTEGER DEFAULT 30,
    ai_context TEXT,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminder Settings table
CREATE TABLE IF NOT EXISTS reminder_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_identifier VARCHAR(255),
    default_reminder_minutes INTEGER DEFAULT 30,
    notification_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    email_address VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Chronos indexes
CREATE INDEX IF NOT EXISTS idx_technicians_pin ON technicians(pin_hash);
CREATE INDEX IF NOT EXISTS idx_technicians_active ON technicians(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activity_types_sort ON activity_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_time_entries_technician ON time_entries(technician_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_entry_steps_entry ON entry_steps(entry_id);

-- ZenTask indexes
CREATE INDEX IF NOT EXISTS idx_zentask_status ON zentask_items(status);
CREATE INDEX IF NOT EXISTS idx_zentask_due_date ON zentask_items(due_date);
CREATE INDEX IF NOT EXISTS idx_zentask_priority ON zentask_items(priority);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_user ON reminder_settings(user_identifier);

-- ============================================
-- TRIGGERS FOR AUTO UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
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

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

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

-- Policy: Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read access"
    ON technicians FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access"
    ON customers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access"
    ON projects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access"
    ON tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access"
    ON activity_types FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access"
    ON time_entries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access"
    ON entry_steps FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access"
    ON zentask_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access"
    ON reminder_settings FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert/update/delete their own data
-- For simplicity, we allow all authenticated users full access
-- In production, you may want to restrict by user_id or organization
CREATE POLICY "Allow authenticated full access"
    ON technicians FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access"
    ON customers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access"
    ON projects FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access"
    ON tasks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access"
    ON activity_types FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access"
    ON time_entries FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access"
    ON entry_steps FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access"
    ON zentask_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated full access"
    ON reminder_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate total hours for a technician on a date
CREATE OR REPLACE FUNCTION get_technician_daily_hours(
    tech_id UUID,
    target_date DATE
)
RETURNS TABLE (
    total_minutes INTEGER,
    total_overtime INTEGER,
    entry_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(te.duration_minutes), 0)::INTEGER as total_minutes,
        COALESCE(SUM(te.overtime_minutes), 0)::INTEGER as total_overtime,
        COUNT(te.id) as entry_count
    FROM time_entries te
    WHERE te.technician_id = tech_id
      AND DATE(te.start_time) = target_date
      AND te.status != 'deleted';
END;
$$ LANGUAGE plpgsql;

-- Function to get project summary stats
CREATE OR REPLACE FUNCTION get_project_stats(proj_id UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    total_hours NUMERIC,
    pending_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COALESCE(SUM(te.duration_minutes) / 60.0, 0)::NUMERIC as total_hours,
        COUNT(CASE WHEN t.status IN ('pending', 'in_progress') THEN 1 END) as pending_tasks
    FROM tasks t
    LEFT JOIN time_entries te ON t.id = te.task_id
    WHERE t.project_id = proj_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA - ACTIVITY TYPES
-- ============================================

INSERT INTO activity_types (name, description, color, is_billable, sort_order) VALUES
('Installation', 'New equipment installation', '#3B82F6', true, 1),
('Maintenance', 'Regular maintenance work', '#10B981', true, 2),
('Repair', 'Equipment repair services', '#F59E0B', true, 3),
('Inspection', 'Safety and compliance inspection', '#8B5CF6', true, 4),
('Consultation', 'Client consultation and planning', '#EC4899', true, 5),
('Travel', 'Travel time to/from site', '#6B7280', false, 6)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA - SAMPLE TASK TEMPLATES
-- ============================================

INSERT INTO tasks (title, description, estimated_duration, priority, status) VALUES
('Initial Site Assessment', 'Conduct comprehensive site evaluation', 60, 'high', 'pending'),
('Equipment Installation', 'Install and configure new equipment', 240, 'high', 'pending'),
('System Testing', 'Perform full system functionality tests', 90, 'medium', 'pending'),
('Client Training', 'Train client on system operation', 120, 'medium', 'pending')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
-- Schema successfully created!
-- You can now:
-- 1. Install Supabase client: npm install @supabase/supabase-js
-- 2. Create supabase client config in your projects
-- 3. Update your services to use Supabase instead of localStorage
-- ============================================
