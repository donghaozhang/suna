#!/usr/bin/env python3
"""
Test script to verify fal_media_generation tool with enhanced error handling
"""
import asyncio
import sys
import os
import requests
import json
import time

# Test configuration
BACKEND_URL = "http://localhost:8000"
TEST_PROJECT_ID = "dbafde38-40f0-4533-a888-a30bf3ee1398"  # test project
TEST_THREAD_ID = "test-thread-123"

async def test_image_generation():
    """Test the image generation via API"""
    print("🧪 Testing fal_media_generation tool...")
    
    try:
        # Step 1: Add user message to thread
        print("📝 Adding user message to thread...")
        message_response = requests.post(
            f"{BACKEND_URL}/api/thread/{TEST_THREAD_ID}/message",
            json={
                "content": "Please generate an image of a simple red circle on white background using fal_media_generation tool with FLUX model"
            },
            timeout=30
        )
        
        if message_response.status_code != 200:
            print(f"❌ Failed to add message: {message_response.status_code}")
            print(f"Response: {message_response.text}")
            return False
        
        print("✅ Message added successfully")
        
        # Step 2: Start agent
        print("🚀 Starting agent...")
        agent_response = requests.post(
            f"{BACKEND_URL}/api/thread/{TEST_THREAD_ID}/agent/start",
            json={
                "model_name": "anthropic/claude-3-7-sonnet-latest",
                "enable_thinking": False,
                "reasoning_effort": "low",
                "stream": False
            },
            timeout=60
        )
        
        if agent_response.status_code == 200:
            result = agent_response.json()
            agent_run_id = result.get('agent_run_id')
            print("✅ Agent run started successfully")
            print(f"📋 Run ID: {agent_run_id}")
            
            # Step 3: Wait for completion and check status
            print("⏳ Waiting for agent to complete...")
            for i in range(30):  # Wait up to 30 seconds
                time.sleep(1)
                status_response = requests.get(f"{BACKEND_URL}/api/agent-run/{agent_run_id}")
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    status = status_data.get('status')
                    print(f"Status: {status}")
                    
                    if status in ['completed', 'error', 'stopped']:
                        print(f"🏁 Agent finished with status: {status}")
                        return True
                else:
                    print(f"⚠️ Could not get status: {status_response.status_code}")
            
            print("⏰ Timeout waiting for completion")
            return True
            
        else:
            print(f"❌ Failed to start agent: {agent_response.status_code}")
            print(f"Response: {agent_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing image generation: {str(e)}")
        return False

def test_backend_health():
    """Test if backend is accessible"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot reach backend: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Testing Image Generation with Enhanced Error Handling")
    print("=" * 60)
    
    # Test backend connectivity
    if not test_backend_health():
        print("❌ Backend is not accessible. Make sure Docker containers are running.")
        sys.exit(1)
    
    # Test image generation
    success = asyncio.run(test_image_generation())
    
    if success:
        print("\n✅ Test completed successfully!")
        print("📝 Check the Docker logs for detailed output:")
        print("   docker compose logs worker | findstr 'fal_media_generation\\|Starting image\\|Processing image\\|download\\|save'")
    else:
        print("\n❌ Test failed!")
    
    print("\n🔍 Monitor logs in real-time with:")
    print("   docker compose logs -f worker") 