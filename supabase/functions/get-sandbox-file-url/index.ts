import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Daytona } from "https://deno.land/x/daytona/mod.ts";

const daytona = new Daytona();

console.log("get-sandbox-file-url function started");

Deno.serve(async (req) => {
  try {
    const { projectId, path } = await req.json();

    if (!projectId || !path) {
      throw new Error("Missing projectId or path");
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_ANON_KEY") ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // You might want to add row-level security to check 
    // if the user has access to this project's sandbox
    
    const sandbox = await daytona.getSandbox(projectId, user.id);
    if (!sandbox) {
      throw new Error("Sandbox not found or access denied");
    }

    const { signedURL, fileMetadata } = await sandbox.getSignedUrl(path);

    return new Response(
      JSON.stringify({ signedURL, fileMetadata }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in get-sandbox-file-url:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 400 }
    );
  }
}); 