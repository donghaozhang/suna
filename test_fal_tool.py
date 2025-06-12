import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append('/app')

from agent.tools.fal_media_tool import FalMediaToolClass
from agentpress.thread_manager import ThreadManager
from services.supabase import DBConnection

async def test_fal_tool_with_real_project():
    try:
        print("🧪 Testing FalMediaTool with real project ID...")
        
        # Use a real project ID from the database
        real_project_id = "dbafde38-40f0-4533-a888-a30bf3ee1398"  # "test" project
        test_thread_id = "test-thread-123"  # Test thread ID
        
        # Create a thread manager (simulating real agent environment)
        thread_manager = ThreadManager()
        
        # Create tool instance with proper parameters
        tool = FalMediaToolClass(
            project_id=real_project_id, 
            thread_id=test_thread_id,
            thread_manager=thread_manager
        )
        print('✅ Tool created successfully with real project ID')
        
        # Test the tool function
        print("🎨 Generating image...")
        result = await tool.fal_media_generation(
            prompt='A simple red circle on white background',
            model_id='fal-ai/flux/schnell'
        )
        print('✅ Tool execution result:')
        print(result)
        
    except Exception as e:
        print('❌ Error:', str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_fal_tool_with_real_project()) 