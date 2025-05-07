-- Restore missing columns to the agent_runs table
ALTER TABLE "public"."agent_runs" ADD COLUMN "thread_id" UUID REFERENCES "public"."threads"("thread_id") ON DELETE CASCADE;
ALTER TABLE "public"."agent_runs" ADD COLUMN "completed_at" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "public"."agent_runs" ADD COLUMN "error" TEXT;
ALTER TABLE "public"."agent_runs" ADD COLUMN "responses" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "public"."agent_runs" ADD COLUMN "started_at" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE "public"."agent_runs" ADD COLUMN "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- Recreate indexes
CREATE INDEX "idx_agent_runs_thread_id" ON public.agent_runs USING btree (thread_id);
CREATE INDEX "idx_agent_runs_created_at" ON public.agent_runs USING btree (created_at);

-- Recreate updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate triggers for updated_at
CREATE TRIGGER "update_agent_runs_updated_at"
    BEFORE UPDATE ON public.agent_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Re-enable Row Level Security
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy for agent_runs based only on thread_id
CREATE POLICY "agent_run_select_policy" ON public.agent_runs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.threads
            WHERE threads.thread_id = agent_runs.thread_id
            AND (
                threads.is_public = TRUE OR
                basejump.has_role_on_account(threads.account_id) = true
            )
        )
    );

CREATE POLICY "agent_run_insert_policy" ON public.agent_runs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.threads
            WHERE threads.thread_id = agent_runs.thread_id
            AND (
                basejump.has_role_on_account(threads.account_id) = true
            )
        )
    );

CREATE POLICY "agent_run_update_policy" ON public.agent_runs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.threads
            WHERE threads.thread_id = agent_runs.thread_id
            AND (
                basejump.has_role_on_account(threads.account_id) = true
            )
        )
    );

CREATE POLICY "agent_run_delete_policy" ON public.agent_runs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.threads
            WHERE threads.thread_id = agent_runs.thread_id
            AND (
                basejump.has_role_on_account(threads.account_id) = true
            )
        )
    );

-- Grant privileges
GRANT ALL PRIVILEGES ON TABLE public.agent_runs TO authenticated, service_role; 