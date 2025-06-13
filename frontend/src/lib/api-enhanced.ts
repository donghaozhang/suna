import { createClient } from '@/lib/supabase/client';
import { backendApi, supabaseClient } from './api-client';
import { handleApiSuccess } from './error-handler';
import { 
  Project, 
  Thread, 
  Message, 
  AgentRun, 
  InitiateAgentResponse,
  HealthCheckResponse,
  FileInfo,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CreatePortalSessionRequest,
  SubscriptionStatus,
  AvailableModelsResponse,
  BillingStatusResponse,
  BillingError
} from './api';

export * from './api';

export const projectsApi = {
  async getAll(): Promise<Project[]> {
    const result = await supabaseClient.execute(
      async () => {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          return { data: null, error: userError };
        }

        if (!userData.user) {
          return { data: [], error: null };
        }

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('account_id', userData.user.id);

        if (error) {
          if (error.code === '42501' && error.message.includes('has_role_on_account')) {
            return { data: [], error: null };
          }
          return { data: null, error };
        }

        const mappedProjects: Project[] = (data || []).map((project) => ({
          id: project.project_id,
          name: project.name || '',
          description: project.description || '',
          account_id: project.account_id,
          created_at: project.created_at,
          updated_at: project.updated_at,
          sandbox: project.sandbox || {
            id: '',
            pass: '',
            vnc_preview: '',
            sandbox_url: '',
          },
        }));

        return { data: mappedProjects, error: null };
      },
      { operation: 'load projects', resource: 'projects' }
    );

    return result.data || [];
  },

  async getById(projectId: string): Promise<Project | null> {
    const result = await supabaseClient.execute(
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return { data: null, error: new Error(`Project not found: ${projectId}`) };
          }
          return { data: null, error };
        }

        // Ensure sandbox is active if it exists
        if (data.sandbox?.id) {
          backendApi.post(`/project/${projectId}/sandbox/ensure-active`, undefined, {
            showErrors: false,
            errorContext: { silent: true }
          });
        }

        const mappedProject: Project = {
          id: data.project_id,
          name: data.name || '',
          description: data.description || '',
          account_id: data.account_id,
          is_public: data.is_public || false,
          created_at: data.created_at,
          sandbox: data.sandbox || {
            id: '',
            pass: '',
            vnc_preview: '',
            sandbox_url: '',
          },
        };

        return { data: mappedProject, error: null };
      },
      { operation: 'load project', resource: `project ${projectId}` }
    );

    return result.data || null;
  },

  async create(projectData: { name: string; description: string }, accountId?: string): Promise<Project | null> {
    const result = await supabaseClient.execute(
      async () => {
        const supabase = createClient();
        
        if (!accountId) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) return { data: null, error: userError };
          if (!userData.user) return { data: null, error: new Error('You must be logged in to create a project') };
          accountId = userData.user.id;
        }

        const { data, error } = await supabase
          .from('projects')
          .insert({
            name: projectData.name,
            description: projectData.description || null,
            account_id: accountId,
          })
          .select()
          .single();

        if (error) return { data: null, error };

        const project: Project = {
          id: data.project_id,
          name: data.name,
          description: data.description || '',
          account_id: data.account_id,
          created_at: data.created_at,
          sandbox: { id: '', pass: '', vnc_preview: '' },
        };

        return { data: project, error: null };
      },
      { operation: 'create project', resource: 'project' }
    );

    return result.data || null;
  },

  async update(projectId: string, data: Partial<Project>): Promise<Project | null> {
    if (!projectId || projectId === '') {
      throw new Error('Cannot update project: Invalid project ID');
    }

    const result = await supabaseClient.execute(
      async () => {
        const supabase = createClient();
        const { data: updatedData, error } = await supabase
          .from('projects')
          .update(data)
          .eq('project_id', projectId)
          .select()
          .single();

        if (error) return { data: null, error };
        if (!updatedData) return { data: null, error: new Error('No data returned from update') };

        // Dispatch custom event for project updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('project-updated', {
              detail: {
                projectId,
                updatedData: {
                  id: updatedData.project_id,
                  name: updatedData.name,
                  description: updatedData.description,
                },
              },
            }),
          );
        }

        const project: Project = {
          id: updatedData.project_id,
          name: updatedData.name,
          description: updatedData.description || '',
          account_id: updatedData.account_id,
          created_at: updatedData.created_at,
          sandbox: updatedData.sandbox || {
            id: '',
            pass: '',
            vnc_preview: '',
            sandbox_url: '',
          },
        };

        return { data: project, error: null };
      },
      { operation: 'update project', resource: `project ${projectId}` }
    );
    return result.data || null;
  },

  async delete(projectId: string): Promise<boolean> {
    const result = await supabaseClient.execute(
      async () => {
        const supabase = createClient();
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('project_id', projectId);

        return { data: !error, error };
      },
      { operation: 'delete project', resource: `project ${projectId}` }
    );
    return result.success;
  },
};

export const threadsApi = {
  async getAll(projectId?: string): Promise<Thread[]> {
    const result = await supabaseClient.execute(
      async () => {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) return { data: null, error: userError };
        if (!userData.user) return { data: [], error: null };

        let query = supabase.from('threads').select('*').eq('account_id', userData.user.id);
        
        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (error) return { data: null, error };

        const mappedThreads: Thread[] = (data || []).map((thread) => ({
          thread_id: thread.thread_id,
          account_id: thread.account_id,
          project_id: thread.project_id,
          created_at: thread.created_at,
          updated_at: thread.updated_at,
        }));

        return { data: mappedThreads, error: null };
      },
      { operation: 'load threads', resource: projectId ? `threads for project ${projectId}` : 'threads' }
    );

    return result.data || [];
  },

  async getById(threadId: string): Promise<Thread | null> {
    const result = await supabaseClient.execute(
      async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('threads')
          .select('*')
          .eq('thread_id', threadId)
          .single();

        return { data, error };
      },
      { operation: 'load thread', resource: `thread ${threadId}` }
    );

    return result.data || null;
  },

  async create(projectId: string): Promise<Thread | null> {
    const result = await supabaseClient.execute(
      async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return { data: null, error: new Error('You must be logged in to create a thread') };
        }

        const { data, error } = await supabase
          .from('threads')
          .insert({
            project_id: projectId,
            account_id: user.id,
          })
          .select()
          .single();

        return { data, error };
      },
      { operation: 'create thread', resource: 'thread' }
    );
    return result.data || null;
  },
};

export const agentApi = {
  async start(
    threadId: string,
    options?: {
      model_name?: string;
      enable_thinking?: boolean;
      reasoning_effort?: string;
      stream?: boolean;
    }
  ): Promise<{ agent_run_id: string } | null> {
    const result = await backendApi.post(
      `/thread/${threadId}/agent/start`,
      options,
      {
        errorContext: { operation: 'start agent', resource: 'AI assistant' },
        timeout: 60000,
      }
    );
    return result.data || null;
  },

  async stop(agentRunId: string): Promise<boolean> {
    const result = await backendApi.post(
      `/agent/${agentRunId}/stop`,
      undefined,
      {
        errorContext: { operation: 'stop agent', resource: 'AI assistant' },
      }
    );

    if (result.success) {
      handleApiSuccess('AI assistant stopped');
    }

    return result.success;
  },

  async getStatus(agentRunId: string): Promise<AgentRun | null> {
    const result = await backendApi.get(
      `/agent/${agentRunId}/status`,
      {
        errorContext: { operation: 'get agent status', resource: 'AI assistant status' },
        showErrors: false,
      }
    );

    return result.data || null;
  },

  async getRuns(threadId: string): Promise<AgentRun[]> {
    const result = await backendApi.get(
      `/thread/${threadId}/agent/runs`,
      {
        errorContext: { operation: 'load agent runs', resource: 'conversation history' },
      }
    );

    return result.data || [];
  },
};

export const billingApi = {
  async getSubscription(): Promise<SubscriptionStatus | null> {
    // MOCK: Return mock subscription data to prevent 404 errors
    console.log('[BILLING] Using mock subscription data from enhanced API - billing disabled');
    return {
      status: 'active',
      plan_name: 'free',
      price_id: 'free',
      current_period_end: null,
      cancel_at_period_end: false,
      trial_end: null,
      minutes_limit: 999999,
      current_usage: 0,
      has_schedule: false,
      scheduled_plan_name: null,
      scheduled_price_id: null,
      scheduled_change_date: null,
    };
  },

  async checkStatus(): Promise<BillingStatusResponse | null> {
    // MOCK: Return mock billing status to prevent 404 errors
    console.log('[BILLING] Using mock billing status - billing disabled');
    return {
      can_run: true,
      message: 'Billing disabled - unlimited usage',
      subscription: {
        price_id: 'free',
        plan_name: 'free',
        minutes_limit: 999999,
      },
    };
  },

  async createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse | null> {
    // MOCK: Return mock checkout session to prevent 404 errors
    console.log('[BILLING] Checkout session disabled - billing disabled');
    return {
      status: 'no_change',
      message: 'Billing disabled - no checkout needed',
    };
  },

  async createPortalSession(request: CreatePortalSessionRequest): Promise<{ url: string } | null> {
    // MOCK: Return mock portal session to prevent 404 errors
    console.log('[BILLING] Portal session disabled - billing disabled');
    return { url: '#' };
  },

  async getAvailableModels(): Promise<AvailableModelsResponse | null> {
    // MOCK: Return mock available models to prevent 404 errors
    console.log('[BILLING] Using mock available models from enhanced API - billing disabled');
    return {
      models: [
        { id: 'gpt-4o', display_name: 'GPT-4o', short_name: 'GPT-4o', requires_subscription: false },
        { id: 'gpt-4o-mini', display_name: 'GPT-4o Mini', short_name: 'GPT-4o Mini', requires_subscription: false },
        { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet', short_name: 'Claude 3.5 Sonnet', requires_subscription: false },
        { id: 'o1-preview', display_name: 'OpenAI o1 Preview', short_name: 'o1 Preview', requires_subscription: false },
        { id: 'o1-mini', display_name: 'OpenAI o1 Mini', short_name: 'o1 Mini', requires_subscription: false },
      ],
      subscription_tier: 'free',
      total_models: 5,
    };
  },
};

export const healthApi = {
  async check(): Promise<HealthCheckResponse | null> {
    const result = await backendApi.get(
      '/health',
      {
        errorContext: { operation: 'check system health', resource: 'system status' },
        timeout: 10000,
      }
    );

    return result.data || null;
  },
}; 