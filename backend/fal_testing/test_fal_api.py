#!/usr/bin/env python3
"""
Simple test script for fal.ai API integration

This script tests the fal.ai API by generating a simple image.
Make sure to set the FAL_KEY environment variable before running.

Usage:
    export FAL_KEY=your_fal_api_key
    python test_fal_api.py
"""

import os
import asyncio
import fal_client
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables from backend/.env file
load_dotenv('../.env')


async def test_fal_image_generation():
    """Test basic image generation with fal.ai API"""
    
    # Check if API key is set
    api_key = os.getenv("FAL_KEY")
    if not api_key:
        print("❌ Error: FAL_KEY environment variable not set")
        print("Please set your fal.ai API key:")
        print("export FAL_KEY=your_fal_api_key")
        return False
    
    print(f"✅ FAL_KEY found: {api_key[:8]}...")
    
    # Test parameters
    test_prompt = "A beautiful sunset over mountains, digital art style"
    model_id = "fal-ai/flux/schnell"  # Fast model for testing
    
    print(f"\n🎨 Testing image generation with:")
    print(f"   Model: {model_id}")
    print(f"   Prompt: {test_prompt}")
    
    try:
        # Test the fal.ai API
        print("\n⏳ Generating image...")
        
        result = await fal_client.run_async(
            model_id,
            arguments={
                "prompt": test_prompt,
                "image_size": "landscape_4_3",
                "num_images": 1,
                "seed": 42  # For reproducible results
            }
        )
        
        print("✅ Image generation successful!")
        print(f"   Result keys: {list(result.keys())}")
        
        # Extract image URLs
        images = []
        if "images" in result:
            images = [img["url"] if isinstance(img, dict) else img for img in result["images"]]
        elif "image" in result:
            if isinstance(result["image"], str):
                images = [result["image"]]
            elif isinstance(result["image"], dict) and "url" in result["image"]:
                images = [result["image"]["url"]]
        
        if images:
            print(f"✅ Generated {len(images)} image(s):")
            for i, url in enumerate(images, 1):
                print(f"   Image {i}: {url}")
        else:
            print("⚠️  No image URLs found in response")
            print(f"   Full result: {result}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error during image generation: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        return False


async def test_multiple_models():
    """Test multiple fal.ai models to see which ones work"""
    
    models_to_test = [
        "fal-ai/flux/schnell",  # Fast
        "fal-ai/flux/dev",      # High quality  
        "fal-ai/stable-diffusion-xl",  # Classic
    ]
    
    test_prompt = "A cute cat sitting on a windowsill"
    
    print("\n🧪 Testing multiple models...")
    
    results = {}
    
    for model_id in models_to_test:
        print(f"\n📝 Testing {model_id}...")
        
        try:
            result = await fal_client.run_async(
                model_id,
                arguments={
                    "prompt": test_prompt,
                    "image_size": "square",
                    "num_images": 1
                }
            )
            
            results[model_id] = "✅ Success"
            print(f"   ✅ {model_id} - Working")
            
        except Exception as e:
            results[model_id] = f"❌ Error: {str(e)}"
            print(f"   ❌ {model_id} - Failed: {str(e)}")
    
    print("\n📊 Model Test Results:")
    for model, status in results.items():
        print(f"   {model}: {status}")
    
    return results


async def main():
    """Main test function"""
    print("🚀 fal.ai API Test Script")
    print("=" * 50)
    
    # Test 1: Basic image generation
    print("\n1️⃣  Basic Image Generation Test")
    success = await test_fal_image_generation()
    
    if success:
        # Test 2: Multiple models (only if basic test works)
        print("\n2️⃣  Multiple Models Test")
        await test_multiple_models()
    
    print("\n✨ Test completed!")


if __name__ == "__main__":
    # Check if fal_client is available
    try:
        import fal_client
        print("✅ fal_client imported successfully")
    except ImportError:
        print("❌ fal_client not found. Install with: pip install fal-client")
        exit(1)
    
    # Run the async test
    asyncio.run(main()) 