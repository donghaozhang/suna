import { createClient } from '@/lib/supabase/client';

// Get backend URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Set to keep track of agent runs that are known to be non-running
const nonRunningAgentRuns = new Set<string>();
// Map to keep track of active EventSource streams
const activeStreams = new Map<string, EventSource>();

// Custom error for billing issues
export class BillingError extends Error {
  status: number;
  detail: { message: string; [key: string]: any }; // Allow other properties in detail

  constructor(status: number, detail: { message: string; [key: string]: any }, message?: string) {
    super(message || detail.message || `Billing Error: ${status}`);
    this.name = 'BillingError';
    this.status = status;
    this.detail = detail;
    
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BillingError.prototype);
  }
}

// Type Definitions (moved from potential separate file for clarity)
export type Project = {
  id: string;
  name: string;
  description: string;
  account_id: string;
  created_at: string;
  updated_at?: string;
  sandbox: {
    vnc_preview?: string;
    sandbox_url?: string;
    id?: string;
    pass?: string;
  };
  is_public?: boolean; // Flag to indicate if the project is public
  [key: string]: any; // Allow additional properties to handle database fields
}

export type Thread = {
  thread_id: string;
  account_id: string | null;
  project_id?: string | null;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow additional properties to handle database fields
}

export type Message = {
  role: string;
  content: string;
  type: string;
}

export type AgentRun = {
  id: string | number;  // Updated to handle both string and number types
  thread_id: string;
  status: 'running' | 'completed' | 'stopped' | 'error';
  started_at: string;
  completed_at: string | null;
  responses: Message[];
  error: string | null;
}

export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
}

export interface InitiateAgentResponse {
  thread_id: string;
  agent_run_id: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  instance_id: string;
}

export interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  mod_time: string;
  permissions?: string;
}

// Project APIs
export const getProjects = async (): Promise<Project[]> => {
  try {
    const supabase = createClient();
    
    // Get the current user's ID to filter projects
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting current user:', userError);
      return [];
    }
    
    // If no user is logged in, return an empty array
    if (!userData.user) {
      console.log('[API] No user logged in, returning empty projects array');
      return [];
    }
    
    // Query only projects where account_id matches the current user's ID
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('account_id', userData.user.id);
    
    if (error) {
      // Handle permission errors specifically
      if (error.code === '42501' && error.message.includes('has_role_on_account')) {
        console.error('Permission error: User does not have proper account access');
        return []; // Return empty array instead of throwing
      }
      throw error;
    }
    
    console.log('[API] Raw projects from DB:', data?.length, data);
    
    // Map database fields to our Project type 
    const mappedProjects: Project[] = (data || []).map(project => ({
      id: project.project_id,
      name: project.name || '',
      description: project.description || '',
      account_id: project.account_id,
      created_at: project.created_at,
      updated_at: project.updated_at,
      sandbox: project.sandbox || { id: "", pass: "", vnc_preview: "", sandbox_url: "" }
    }));
    
    console.log('[API] Mapped projects for frontend:', mappedProjects.length);
    
    return mappedProjects;
  } catch (err) {
    console.error('Error fetching projects:', err);
    // Return empty array for permission errors to avoid crashing the UI
    return [];
  }
};

export const getProject = async (projectId: string): Promise<Project> => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error) {
      // Handle the specific "no rows returned" error from Supabase
      if (error.code === 'PGRST116') {
        throw new Error(`Project not found or not accessible: ${projectId}`);
      }
      throw error;
    }

    console.log('Raw project data from database:', data);

    // If project has a sandbox, ensure it's started
    if (data.sandbox?.id) {
      // Fire off sandbox activation without blocking
      const ensureSandboxActive = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          // For public projects, we don't need authentication
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
          
          console.log(`Ensuring sandbox is active for project ${projectId}...`);
          const response = await fetch(`${API_URL}/project/${projectId}/sandbox/ensure-active`, {
            method: 'POST',
            headers,
          });
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error details available');
            console.warn(`Failed to ensure sandbox is active: ${response.status} ${response.statusText}`, errorText);
          } else {
            console.log('Sandbox activation successful');
          }
        } catch (sandboxError) {
          console.warn('Failed to ensure sandbox is active:', sandboxError);
        }
      };

      // Start the sandbox activation without awaiting
      ensureSandboxActive();
    }
    
    // Map database fields to our Project type
    const mappedProject: Project = {
      id: data.project_id,
      name: data.name || '',
      description: data.description || '',
      account_id: data.account_id,
      is_public: data.is_public || false,
      created_at: data.created_at,
      sandbox: data.sandbox || { id: "", pass: "", vnc_preview: "", sandbox_url: "" }
    };
    
    console.log('Mapped project data for frontend:', mappedProject);
    
    return mappedProject;
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    throw error;
  }
};

export const createProject = async (
  projectData: { name: string; description: string }, 
  accountId?: string
): Promise<Project> => {
  const supabase = createClient();
  
  // If accountId is not provided, we'll need to get the user's ID
  if (!accountId) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!userData.user) throw new Error('You must be logged in to create a project');
    
    // In Basejump, the personal account ID is the same as the user ID
    accountId = userData.user.id;
  }
  
  const { data, error } = await supabase
    .from('projects')
    .insert({ 
      name: projectData.name, 
      description: projectData.description || null,
      account_id: accountId
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Map the database response to our Project type
  return {
    id: data.project_id,
    name: data.name,
    description: data.description || '',
    account_id: data.account_id,
    created_at: data.created_at,
    sandbox: { id: "", pass: "", vnc_preview: "" }
  };
};

export const updateProject = async (projectId: string, data: Partial<Project>): Promise<Project> => {
  const supabase = createClient();
  
  console.log('Updating project with ID:', projectId);
  console.log('Update data:', data);
  
  // Sanity check to avoid update errors
  if (!projectId || projectId === '') {
    console.error('Attempted to update project with invalid ID:', projectId);
    throw new Error('Cannot update project: Invalid project ID');
  }
  
  const { data: updatedData, error } = await supabase
    .from('projects')
    .update(data)
    .eq('project_id', projectId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }
  
  if (!updatedData) {
    throw new Error('No data returned from update');
  }
  
  // Dispatch a custom event to notify components about the project change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('project-updated', { 
      detail: { 
        projectId, 
        updatedData: {
          id: updatedData.project_id,
          name: updatedData.name,
          description: updatedData.description
        }
      } 
    }));
  }
  
  // Return formatted project data - use same mapping as getProject
  return {
    id: updatedData.project_id,
    name: updatedData.name,
    description: updatedData.description || '',
    account_id: updatedData.account_id,
    created_at: updatedData.created_at,
    sandbox: updatedData.sandbox || { id: "", pass: "", vnc_preview: "", sandbox_url: "" }
  };
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('project_id', projectId);
  
  if (error) throw error;
};

// Thread APIs
export const getThreads = async (projectId?: string): Promise<Thread[]> => {
  const supabase = createClient();
  
  // Get the current user's ID to filter threads
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error getting current user:', userError);
    return [];
  }
  
  // If no user is logged in, return an empty array
  if (!userData.user) {
    console.log('[API] No user logged in, returning empty threads array');
    return [];
  }
  
  let query = supabase.from('threads').select('*');
  
  // Always filter by the current user's account ID
  query = query.eq('account_id', userData.user.id);
  
  if (projectId) {
    console.log('[API] Filtering threads by project_id:', projectId);
    query = query.eq('project_id', projectId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[API] Error fetching threads:', error);
    throw error;
  }
  
  console.log('[API] Raw threads from DB:', data?.length, data);
  
  // Map database fields to ensure consistency with our Thread type
  const mappedThreads: Thread[] = (data || []).map(thread => ({
    thread_id: thread.thread_id,
    account_id: thread.account_id,
    project_id: thread.project_id,
    created_at: thread.created_at,
    updated_at: thread.updated_at
  }));
  
  return mappedThreads;
};

export const getThread = async (threadId: string): Promise<Thread> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('thread_id', threadId)
    .single();
  
  if (error) throw error;
  
  return data;
};

export const createThread = async (projectId: string): Promise<Thread> => {
  const supabase = createClient();
  
  // If user is not logged in, redirect to login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to create a thread');
  }
  
  const { data, error } = await supabase
    .from('threads')
    .insert({
      project_id: projectId,
      account_id: user.id, // Use the current user's ID as the account ID
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

export const addUserMessage = async (threadId: string, content: string): Promise<void> => {
  const supabase = createClient();
  
  // Format the message in the format the LLM expects - keep it simple with only required fields
  const message = {
    role: 'user',
    content: content
  };
  
  // Insert the message into the messages table
  const { error } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      type: 'user',
      is_llm_message: true,
      content: JSON.stringify(message)
    });
  
  if (error) {
    console.error('Error adding user message:', error);
    throw new Error(`Error adding message: ${error.message}`);
  }
};

export const getMessages = async (threadId: string): Promise<Message[]> => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .neq('type', 'cost')
    .neq('type', 'summary')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error(`Error getting messages: ${error.message}`);
  }

  console.log('[API] Messages fetched:', data);
  
  return data || [];
};

// Agent APIs
export const startAgent = async (
  threadId: string, 
  options?: {
    model_name?: string;
    enable_thinking?: boolean;
    reasoning_effort?: string;
    stream?: boolean;
  }
): Promise<{ agent_run_id: string }> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    // Check if backend URL is configured
    if (!API_URL) {
      throw new Error('Backend URL is not configured. Set NEXT_PUBLIC_BACKEND_URL in your environment.');
    }

    console.log(`[API] Starting agent for thread ${threadId} using ${API_URL}/thread/${threadId}/agent/start`);
    
    const response = await fetch(`${API_URL}/thread/${threadId}/agent/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      // Add cache: 'no-store' to prevent caching
      cache: 'no-store',
      // Add the body, stringifying the options or an empty object
      body: JSON.stringify(options || {}),
    });
    
    if (!response.ok) {
      // Check for 402 Payment Required first
      if (response.status === 402) {
        try {
          const errorData = await response.json();
          console.error(`[API] Billing error starting agent (402):`, errorData);
          // Ensure detail exists and has a message property
          const detail = errorData?.detail || { message: 'Payment Required' };
          if (typeof detail.message !== 'string') {
            detail.message = 'Payment Required'; // Default message if missing
          }
          throw new BillingError(response.status, detail);
        } catch (parseError) {
          // Handle cases where parsing fails or the structure isn't as expected
          console.error('[API] Could not parse 402 error response body:', parseError);
          throw new BillingError(response.status, { message: 'Payment Required' }, `Error starting agent: ${response.statusText} (402)`);
        }
      }

      // Special handling for 500 errors from basejump schema issue
      if (response.status === 500) {
        // In development, return a mock response with a temporary ID
        console.warn('[API] Server returned 500, generating mock agent run ID for development');
        return { 
          agent_run_id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` 
        };
      }
      
      // Handle other errors
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`[API] Error starting agent: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error starting agent: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    // Rethrow BillingError instances directly
    if (error instanceof BillingError) {
      throw error;
    }
    
    console.error('[API] Failed to start agent:', error);
    
    // Provide clearer error message for network errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend server. Please check your internet connection and make sure the backend is running.`);
    }
    
    // Rethrow other caught errors
    throw error;
  }
};

export const stopAgent = async (agentRunId: string | number): Promise<void> => {
  // Mark agent as non-running to prevent further stream attempts
  nonRunningAgentRuns.add(String(agentRunId));
  
  // Close any existing stream
  const existingStream = activeStreams.get(String(agentRunId));
  if (existingStream) {
    console.log(`[API] Closing existing stream for ${agentRunId} before stopping agent`);
    existingStream.close();
    activeStreams.delete(String(agentRunId));
  }
  
  const supabase = createClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${API_URL}/agent-run/${agentRunId}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to stop agent: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error stopping agent:', error);
    throw error;
  }
};

export const getAgentStatus = async (agentRunId: string | number): Promise<AgentRun> => {
  console.log(`[API] Requesting agent status for ${agentRunId}`);
  
  // Check optimistic state cache first
  if (nonRunningAgentRuns.has(String(agentRunId))) {
    console.log(`[API] Agent run ${agentRunId} is known to be non-running, returning error`);
    throw new Error(`Agent run ${agentRunId} is not running`);
  }

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const url = `${API_URL}/agent-run/${agentRunId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    });
    
    if (!response.ok) {
      // If agent is not found or access denied
      if (response.status === 404 || response.status === 403) {
        nonRunningAgentRuns.add(String(agentRunId));
        throw new Error(`Agent run ${agentRunId} not found or access denied`);
      }
      throw new Error(`Failed to get agent status: ${response.status} ${response.statusText}`);
    }
    
    const agentStatus = await response.json();
    
    // If status is completed/stopped/error, mark as non-running
    if (['completed', 'stopped', 'error'].includes(agentStatus.status)) {
      nonRunningAgentRuns.add(String(agentRunId));
    }
    
    return agentStatus;
  } catch (error) {
    // For client-side errors like network issues, don't cache
    if (error instanceof Error && error.message.includes('not found')) {
      nonRunningAgentRuns.add(String(agentRunId));
    }
    console.error('Error getting agent status:', error);
    throw error;
  }
};

export const getAgentRuns = async (threadId: string): Promise<AgentRun[]> => {
  const supabase = createClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('[API] No access token available for getAgentRuns');
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/thread/${threadId}/agent-runs`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      // Add cache: 'no-store' to prevent caching
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Error getting agent runs: ${response.statusText}`);
    }
    
    const data = await response.json();
    // Convert id from number to string if needed for compatibility
    const agentRuns = data.agent_runs || [];
    
    return agentRuns;
  } catch (error) {
    console.error('Failed to get agent runs:', error);
    throw error;
  }
};

export const streamAgent = (agentRunId: string | number, callbacks: {
  onMessage: (content: string) => void;
  onError: (error: Error | string) => void;
  onClose: () => void;
}): () => void => {
  // Store the normalized ID (as string) to use in the map
  const normalizedId = String(agentRunId);
  
  // If agent run ID is a mock ID (from 500 error handling), simulate a successful completion
  if (typeof agentRunId === 'string' && agentRunId.startsWith('mock_')) {
    console.log(`[API] Detected mock agent run ID: ${agentRunId}, simulating streaming`);
    
    // Simulate a successful response
    setTimeout(() => {
      callbacks.onMessage("I'm sorry, but the server is currently unavailable. This is a simulated response while we work on fixing the issue. Please try again later.");
      
      // Mark as completed after a delay
      setTimeout(() => {
        callbacks.onClose();
      }, 1000);
    }, 500);
    
    // Return a no-op close function
    return () => {
      console.log(`[API] Closing mock stream for ${agentRunId}`);
    };
  }
  
  // If this agent run is known to be non-running, don't start streaming
  if (nonRunningAgentRuns.has(normalizedId)) {
    console.log(`[API] Not starting stream for non-running agent: ${agentRunId}`);
    callbacks.onError(new Error(`Agent run ${agentRunId} is not running`));
    return () => {}; // No-op close function
  }
  
  // Close any existing stream for this agent run
  if (activeStreams.has(normalizedId)) {
    const existingStream = activeStreams.get(normalizedId)!;
    console.log(`[API] Closing existing stream for ${agentRunId} before creating a new one`);
    existingStream.close();
    activeStreams.delete(normalizedId);
  }
  
  // Define the setup function
  const setupStream = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No access token available for streaming');
      }

      // Create stream URL
      const streamUrl = new URL(`${API_URL}/agent-run/${agentRunId}/stream`);
      
      // Add token as query parameter
      streamUrl.searchParams.append('token', session.access_token);
      
      // Create the stream
      console.log(`[API] Creating EventSource for ${agentRunId} at ${streamUrl}`);
      const eventSource = new EventSource(streamUrl.toString());
      
      // Store in active streams
      activeStreams.set(normalizedId, eventSource);
      
      // Define event handlers
      eventSource.onmessage = (event) => {
        try {
          if (event.data.trim() === '[DONE]') {
            console.log(`[API] Stream completed for ${agentRunId}`);
            eventSource.close();
            activeStreams.delete(normalizedId);
            nonRunningAgentRuns.add(normalizedId);
            callbacks.onClose();
            return;
          }
          
          const data = JSON.parse(event.data);
          
          if (data.content) {
            callbacks.onMessage(data.content);
          }
        } catch (error) {
          console.error(`[API] Error processing stream message:`, error, event.data);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error(`[API] EventSource error for ${agentRunId}:`, error);
        eventSource.close();
        activeStreams.delete(normalizedId);
        callbacks.onError(error instanceof Error ? error : new Error('EventSource connection error'));
      };
      
      return eventSource;
    } catch (error) {
      console.error(`[API] Error setting up stream for ${agentRunId}:`, error);
      activeStreams.delete(normalizedId);
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };
  
  // Start the stream setup
  setupStream().catch(error => {
    console.error(`[API] Failed to set up stream for ${agentRunId}:`, error);
  });
  
  // Return function to close the stream
  return () => {
    // If this is a mock agent, no need to do anything
    if (typeof agentRunId === 'string' && agentRunId.startsWith('mock_')) {
      return;
    }
    
    const stream = activeStreams.get(normalizedId);
    if (stream) {
      console.log(`[API] Manually closing stream for ${agentRunId}`);
      stream.close();
      activeStreams.delete(normalizedId);
    }
  };
};

// Sandbox API Functions
export const createSandboxFile = async (sandboxId: string, filePath: string, content: string): Promise<void> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Use FormData to handle both text and binary content more reliably
    const formData = new FormData();
    formData.append('path', filePath);
    
    // Create a Blob from the content string and append as a file
    const blob = new Blob([content], { type: 'application/octet-stream' });
    formData.append('file', blob, filePath.split('/').pop() || 'file');

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_URL}/sandboxes/${sandboxId}/files`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Error creating sandbox file: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error creating sandbox file: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to create sandbox file:', error);
    throw error;
  }
};

// Fallback method for legacy support using JSON
export const createSandboxFileJson = async (sandboxId: string, filePath: string, content: string): Promise<void> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_URL}/sandboxes/${sandboxId}/files/json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        path: filePath,
        content: content
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Error creating sandbox file (JSON): ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error creating sandbox file: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to create sandbox file with JSON:', error);
    throw error;
  }
};

export const listSandboxFiles = async (sandboxId: string, path: string): Promise<FileInfo[]> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const url = new URL(`${API_URL}/sandboxes/${sandboxId}/files`);
    url.searchParams.append('path', path);

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url.toString(), {
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Error listing sandbox files: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error listing sandbox files: ${response.statusText} (${response.status})`);
    }
    
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Failed to list sandbox files:', error);
    throw error;
  }
};

export const getSandboxFileContent = async (sandboxId: string, path: string): Promise<string | Blob> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const url = new URL(`${API_URL}/sandboxes/${sandboxId}/files/content`);
    url.searchParams.append('path', path);

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url.toString(), {
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Error getting sandbox file content: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error getting sandbox file content: ${response.statusText} (${response.status})`);
    }
    
    // Check if it's a text file or binary file based on content-type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text') || contentType?.includes('application/json')) {
      return await response.text();
    } else {
      return await response.blob();
    }
  } catch (error) {
    console.error('Failed to get sandbox file content:', error);
    throw error;
  }
};

export const updateThread = async (threadId: string, data: Partial<Thread>): Promise<Thread> => {
  const supabase = createClient();
  
  // Format the data for update
  const updateData = { ...data };
  
  // Update the thread
  const { data: updatedThread, error } = await supabase
    .from('threads')
    .update(updateData)
    .eq('thread_id', threadId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating thread:', error);
    throw new Error(`Error updating thread: ${error.message}`);
  }
  
  return updatedThread;
};

export const toggleThreadPublicStatus = async (threadId: string, isPublic: boolean): Promise<Thread> => {
  return updateThread(threadId, { is_public: isPublic });
};

export const deleteThread = async (threadId: string): Promise<void> => {
  try {
    const supabase = createClient();
    
    // First delete all agent runs associated with this thread
    console.log(`Deleting all agent runs for thread ${threadId}`);
    const { error: agentRunsError } = await supabase
      .from('agent_runs')
      .delete()
      .eq('thread_id', threadId);
    
    if (agentRunsError) {
      console.error('Error deleting agent runs:', agentRunsError);
      throw new Error(`Error deleting agent runs: ${agentRunsError.message}`);
    }
    
    // Then delete all messages associated with the thread
    console.log(`Deleting all messages for thread ${threadId}`);
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('thread_id', threadId);
    
    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      throw new Error(`Error deleting messages: ${messagesError.message}`);
    }
    
    // Finally, delete the thread itself
    console.log(`Deleting thread ${threadId}`);
    const { error: threadError } = await supabase
      .from('threads')
      .delete()
      .eq('thread_id', threadId);
    
    if (threadError) {
      console.error('Error deleting thread:', threadError);
      throw new Error(`Error deleting thread: ${threadError.message}`);
    }
    
    console.log(`Thread ${threadId} successfully deleted with all related items`);
  } catch (error) {
    console.error('Error deleting thread and related items:', error);
    throw error;
  }
};

// Function to get public projects
export const getPublicProjects = async (): Promise<Project[]> => {
  try {
    const supabase = createClient();
    
    // Query for threads that are marked as public
    const { data: publicThreads, error: threadsError } = await supabase
      .from('threads')
      .select('project_id')
      .eq('is_public', true);
    
    if (threadsError) {
      console.error('Error fetching public threads:', threadsError);
      return [];
    }
    
    // If no public threads found, return empty array
    if (!publicThreads?.length) {
      return [];
    }
    
    // Extract unique project IDs from public threads
    const publicProjectIds = [...new Set(publicThreads.map(thread => thread.project_id))].filter(Boolean);
    
    // If no valid project IDs, return empty array
    if (!publicProjectIds.length) {
      return [];
    }
    
    // Get the projects that have public threads
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('project_id', publicProjectIds);
    
    if (projectsError) {
      console.error('Error fetching public projects:', projectsError);
      return [];
    }
    
    console.log('[API] Raw public projects from DB:', projects?.length, projects);
    
    // Map database fields to our Project type
    const mappedProjects: Project[] = (projects || []).map(project => ({
      id: project.project_id,
      name: project.name || '',
      description: project.description || '',
      account_id: project.account_id,
      created_at: project.created_at,
      updated_at: project.updated_at,
      sandbox: project.sandbox || { id: "", pass: "", vnc_preview: "", sandbox_url: "" },
      is_public: true // Mark these as public projects
    }));
    
    console.log('[API] Mapped public projects for frontend:', mappedProjects.length);
    
    return mappedProjects;
  } catch (err) {
    console.error('Error fetching public projects:', err);
    return [];
  }
};

export const initiateAgent = async (formData: FormData): Promise<InitiateAgentResponse> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    // Check if backend URL is configured
    if (!API_URL) {
      throw new Error('Backend URL is not configured. Set NEXT_PUBLIC_BACKEND_URL in your environment.');
    }

    console.log(`[API] Initiating agent with files using ${API_URL}/agent/initiate`);
    
    const response = await fetch(`${API_URL}/agent/initiate`, {
      method: 'POST',
      headers: {
        // Note: Don't set Content-Type for FormData
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
      // Add cache: 'no-store' to prevent caching
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`[API] Error initiating agent: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error initiating agent: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    console.error('[API] Failed to initiate agent:', error);
    
    // Provide clearer error message for network errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend server. Please check your internet connection and make sure the backend is running.`);
    }
    
    throw error;
  }
};

export const checkApiHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`API health check failed: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};

// Billing API Types
export interface CreateCheckoutSessionRequest {
  price_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreatePortalSessionRequest {
  return_url: string;
}

export interface SubscriptionStatus {
  status: string; // Includes 'active', 'trialing', 'past_due', 'scheduled_downgrade', 'no_subscription'
  plan_name?: string;
  price_id?: string; // Added
  current_period_end?: string; // ISO Date string
  cancel_at_period_end: boolean;
  trial_end?: string; // ISO Date string
  minutes_limit?: number;
  current_usage?: number;
  // Fields for scheduled changes
  has_schedule: boolean;
  scheduled_plan_name?: string;
  scheduled_price_id?: string; // Added
  scheduled_change_date?: string; // ISO Date string - Deprecate? Check backend usage
  schedule_effective_date?: string; // ISO Date string - Added for consistency
}

export interface BillingStatusResponse {
  can_run: boolean;
  message: string;
  subscription: {
    price_id: string;
    plan_name: string;
    minutes_limit?: number;
  };
}

export interface CreateCheckoutSessionResponse {
  status: 'upgraded' | 'downgrade_scheduled' | 'checkout_created' | 'no_change' | 'new' | 'updated' | 'scheduled';
  subscription_id?: string;
  schedule_id?: string;
  session_id?: string;
  url?: string;
  effective_date?: string;
  message?: string;
  details?: {
    is_upgrade?: boolean;
    effective_date?: string;
    current_price?: number;
    new_price?: number;
    invoice?: {
      id: string;
      status: string;
      amount_due: number;
      amount_paid: number;
    };
  };
}

// Billing API Functions
export const createCheckoutSession = async (request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/billing/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Error creating checkout session: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error creating checkout session: ${response.statusText} (${response.status})`);
    }
    
    const data = await response.json();
    console.log('Checkout session response:', data);
    
    // Handle all possible statuses
    switch (data.status) {
      case 'upgraded':
      case 'updated':
      case 'downgrade_scheduled':
      case 'scheduled':
      case 'no_change':
        return data;
      case 'new':
      case 'checkout_created':
        if (!data.url) {
          throw new Error('No checkout URL provided');
        }
        return data;
      default:
        console.warn('Unexpected status from createCheckoutSession:', data.status);
        return data;
    }
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

export const createPortalSession = async (request: CreatePortalSessionRequest): Promise<{ url: string }> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/billing/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Error creating portal session: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error creating portal session: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to create portal session:', error);
    throw error;
  }
};

export const getSubscription = async (): Promise<SubscriptionStatus> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/billing/subscription`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Error getting subscription: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error getting subscription: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to get subscription:', error);
    throw error;
  }
};

export const checkBillingStatus = async (): Promise<BillingStatusResponse> => {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/billing/check-status`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Error checking billing status: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error checking billing status: ${response.statusText} (${response.status})`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to check billing status:', error);
    throw error;
  }
};

