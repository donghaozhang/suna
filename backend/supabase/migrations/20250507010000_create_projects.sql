-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    sandbox JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects(account_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Project policies - drop existing policies first
DROP POLICY IF EXISTS project_select_policy ON projects;
DROP POLICY IF EXISTS project_insert_policy ON projects;
DROP POLICY IF EXISTS project_update_policy ON projects;
DROP POLICY IF EXISTS project_delete_policy ON projects;

-- Create policies
CREATE POLICY project_select_policy ON projects
    FOR SELECT
    USING (
        is_public = TRUE OR
        basejump.has_role_on_account(account_id) = true
    );

CREATE POLICY project_insert_policy ON projects
    FOR INSERT
    WITH CHECK (basejump.has_role_on_account(account_id) = true);

CREATE POLICY project_update_policy ON projects
    FOR UPDATE
    USING (basejump.has_role_on_account(account_id) = true);

CREATE POLICY project_delete_policy ON projects
    FOR DELETE
    USING (basejump.has_role_on_account(account_id) = true);

-- Ensure the update_updated_at_column trigger exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant privileges
GRANT ALL PRIVILEGES ON TABLE public.projects TO authenticated, service_role; 