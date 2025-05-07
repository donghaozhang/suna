'use server'

// Assuming API_URL is defined elsewhere and accessible, or we use a relative path
// For Server Actions, calling a relative API path is usually straightforward.
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''; // Or determine if this is needed or if relative path is enough

export const generateThreadName = async (message: string): Promise<string> => {
  // Default name in case the API fails or message is too short
  const defaultName = message.trim().length > 50 
    ? message.trim().substring(0, 47) + "..." 
    : message.trim();
  if (message.trim().length === 0) {
    return "New Chat"; // Or some other generic default for empty messages
  }

  try {
    // The backend endpoint URL
    // If API_URL is the full base URL of the backend (e.g., http://localhost:8000),
    // then the path should be /api/generate-thread-name.
    // If this server action is running in the same Next.js app that serves the API,
    // a relative path might also work, but using the full URL is safer if they are separate.
    const endpoint = `${API_URL}/api/generate-thread-name`;
    
    // console.log(`[generateThreadName] Calling backend: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // If your backend requires an Authorization header (e.g., JWT token),
        // you would need to get it here. Server Actions might have a way to get the current session token.
        // For now, assuming the /api/generate-thread-name endpoint handles auth via cookies or a session
        // managed by `get_current_user` without explicit frontend token passing in this specific server action context.
        // If not, this part will need adjustment.
      },
      body: JSON.stringify({
        message: message // The backend expects an object with a "message" key
      }),
      cache: 'no-store', // Ensure fresh generation
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend API error (generateThreadName):', response.status, errorData);
      return defaultName; // Fallback to default name
    }

    const data = await response.json();
    
    // Assuming the backend returns { "name": "Generated Name" }
    const generatedName = data.name?.trim();
    
    return generatedName || defaultName;
  } catch (error) {
    console.error('Error generating thread name via backend:', error);
    return defaultName; // Fallback to default name
  }
}; 