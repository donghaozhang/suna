-- Add missing columns to agent_runs table
ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.threads(thread_id) ON DELETE CASCADE;
ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS responses JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_runs_thread_id ON public.agent_runs(thread_id); 