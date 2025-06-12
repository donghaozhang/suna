#!/usr/bin/env python3
"""
Test script for Suna's fal media tool

This tests the fal media tool implementation that's part of the Suna project.

Usage:
    cd backend/fal_testing
    python test_suna_fal_tool.py
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables from backend/.env file
load_dotenv('../.env')

# Add backend directory to Python path
sys.path.insert(0, '..')

try:
    from agent.tools.fal_media_tool import FalMediaToolClass
except ImportError as e:
    print(f"❌ Cannot import Suna's fal media tool: {e}")
    print("Make sure you're running this from backend/fal_testing directory")
    print("and that backend dependencies are installed:")
    print("  cd .. && pip install -r requirements.txt")
    sys.exit(1)


async def test_suna_fal_tool():
    """Test Suna's fal media tool implementation"""
    
    print("🧪 Testing Suna's FalMediaTool")
    print("=" * 40)
    
    # Check if API key is set
    api_key = os.getenv("FAL_KEY")
    if not api_key:
        print("❌ FAL_KEY not found in ../env file")
        print("Please add your fal.ai API key to backend/.env:")
        print("FAL_KEY=your_fal_api_key")
        return
    
    print(f"✅ API Key found: {api_key[:8]}...")
    
    # Create tool instance (requires project_id for sandbox access)
    tool = FalMediaToolClass(project_id="test_project")
    
    # Test parameters
    prompt = "An underwater Sanxingdui civilization ruins with prehistoric elements and massive mask architecture in an abyssal setting"
    model_id = "fal-ai/flux/schnell"
    
    print(f"\n🎨 Testing image generation:")
    print(f"   Prompt: {prompt}")
    print(f"   Model: {model_id}")
    
    try:
        # Call the tool's fal_media_generation method
        result = await tool.fal_media_generation(
            prompt=prompt,
            model_id=model_id,
            image_size="landscape_4_3",
            num_images=1,
            seed=42
        )
        
        print(f"\n📋 Tool result:")
        print(f"   Success: {result.success}")
        
        if result.success:
            print(f"   ✅ Image generation successful!")
            if hasattr(result, 'data') and result.data:
                print(f"   Result data keys: {list(result.data.keys())}")
        else:
            print(f"   ❌ Error: {getattr(result, 'data', 'Unknown error')}")
    
    except Exception as e:
        print(f"❌ Exception during tool test: {e}")
        print(f"   Error type: {type(e).__name__}")


async def test_multiple_models_with_tool():
    """Test multiple models using Suna's tool"""
    
    models = [
        "fal-ai/flux/schnell",
        "fal-ai/flux/dev"
    ]
    
    prompt = "A futuristic city skyline at sunset"
    tool = FalMediaToolClass(project_id="test_project")
    
    print(f"\n🔄 Testing multiple models with Suna tool:")
    
    for model_id in models:
        print(f"\n📱 Testing {model_id}...")
        
        try:
            result = await tool.fal_media_generation(
                prompt=prompt,
                model_id=model_id,
                image_size="square",
                num_images=1
            )
            
            if result.success:
                print(f"   ✅ Success - Image generated!")
            else:
                print(f"   ❌ Failed - {getattr(result, 'data', 'Unknown error')}")
                
        except Exception as e:
            print(f"   ❌ Exception - {str(e)}")


async def main():
    """Main test function"""
    # Test 1: Basic tool functionality
    await test_suna_fal_tool()
    
    # Test 2: Multiple models
    await test_multiple_models_with_tool()
    
    print("\n✨ Suna fal tool test completed!")


if __name__ == "__main__":
    asyncio.run(main()) 