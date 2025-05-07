from fastapi import APIRouter, HTTPException
from services.supabase import DBConnection
from utils.logger import logger

router = APIRouter()

@router.get("/db-fix")
async def apply_database_fixes():
    """
    Apply database fixes to restore missing columns in agent_runs table.
    This is a temporary endpoint to fix database schema issues.
    """
    try:
        logger.info("Applying database fixes")
        
        db = DBConnection()
        await db.initialize()
        pool = db.get_pool()
        
        async with pool.acquire() as connection:
            # Add missing columns to agent_runs table
            add_columns_sql = """
                ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.threads(thread_id) ON DELETE CASCADE;
                ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
                ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS error TEXT; 
                ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS responses JSONB NOT NULL DEFAULT '[]'::jsonb;
                ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
                ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
                
                CREATE INDEX IF NOT EXISTS idx_agent_runs_thread_id ON public.agent_runs USING btree (thread_id);
                CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON public.agent_runs USING btree (created_at);
            """
            await connection.execute(add_columns_sql)
            logger.info("Added missing columns to agent_runs table")
            
            # Create updated_at trigger function
            trigger_function_sql = """
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = TIMEZONE('utc'::text, NOW());
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            """
            await connection.execute(trigger_function_sql)
            logger.info("Created update_updated_at_column function")
            
            # Create trigger on agent_runs
            create_trigger_sql = """
                DROP TRIGGER IF EXISTS update_agent_runs_updated_at ON public.agent_runs;
                
                CREATE TRIGGER update_agent_runs_updated_at
                BEFORE UPDATE ON public.agent_runs
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            """
            await connection.execute(create_trigger_sql)
            logger.info("Created update_agent_runs_updated_at trigger")
            
            # Enable RLS and create policies
            enable_rls_sql = """
                ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

                -- Drop existing policies if they exist
                DROP POLICY IF EXISTS agent_run_select_policy ON public.agent_runs;
                DROP POLICY IF EXISTS agent_run_insert_policy ON public.agent_runs;
                DROP POLICY IF EXISTS agent_run_update_policy ON public.agent_runs;
                DROP POLICY IF EXISTS agent_run_delete_policy ON public.agent_runs;

                -- Simple RLS policy for agent_runs based only on thread_id
                CREATE POLICY agent_run_select_policy ON public.agent_runs
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

                CREATE POLICY agent_run_insert_policy ON public.agent_runs
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

                CREATE POLICY agent_run_update_policy ON public.agent_runs
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

                CREATE POLICY agent_run_delete_policy ON public.agent_runs
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
            """
            await connection.execute(enable_rls_sql)
            logger.info("Enabled RLS and created policies for agent_runs table")
        
        return {"status": "Database fixes applied successfully"}
    
    except Exception as e:
        logger.error(f"Error applying database fixes: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to apply database fixes: {str(e)}"
        ) 