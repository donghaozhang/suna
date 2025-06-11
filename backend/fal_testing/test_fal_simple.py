#!/usr/bin/env python3
"""
Simple synchronous test for fal.ai API

This is a minimal test to quickly check if your fal.ai setup is working.
It will automatically load the FAL_KEY from backend/.env file.

Usage:
    python test_fal_simple.py
"""

import os
import fal_client
import requests
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from backend/.env file
load_dotenv('../.env')


def test_fal_simple():
    """Simple synchronous test of fal.ai API"""
    
    # Check API key
    api_key = os.getenv("FAL_KEY")
    if not api_key:
        print("❌ FAL_KEY not found in backend/.env file")
        print("Please add your fal.ai API key to backend/.env:")
        print("FAL_KEY=your_fal_api_key")
        return
    
    print(f"✅ API Key found: {api_key[:8]}...")
    
    # Simple test parameters
    prompt = "A red apple on a wooden table"
    model = "fal-ai/flux/schnell"  # Fast model
    
    print(f"\n🎨 Generating image with prompt: '{prompt}'")
    print(f"📱 Using model: {model}")
    
    try:
        # Generate image using synchronous client
        result = fal_client.run(
            model,
            arguments={
                "prompt": prompt,
                "image_size": "square",
                "num_images": 1
            }
        )
        
        print("✅ Success! Image generated.")
        
        # Print result structure
        print(f"📋 Response keys: {list(result.keys())}")
        
        # Get image URL and save image
        if "images" in result and result["images"]:
            image_url = result["images"][0]["url"]
            print(f"🖼️  Image URL: {image_url}")
            
            # Download and save the image
            try:
                print("📥 Downloading image...")
                response = requests.get(image_url, timeout=30)
                response.raise_for_status()
                
                # Create filename with timestamp
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"images/fal_generated_{timestamp}.png"
                
                # Save the image
                with open(filename, 'wb') as f:
                    f.write(response.content)
                
                print(f"💾 Image saved as: {filename}")
                print(f"📂 File size: {len(response.content) / 1024:.1f} KB")
                
            except Exception as save_error:
                print(f"⚠️  Failed to save image: {save_error}")
                print(f"   You can manually download from: {image_url}")
        else:
            print("⚠️  No images found in response")
            print(f"Full response: {result}")
            
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    print("🧪 Simple fal.ai API Test")
    print("=" * 30)
    test_fal_simple() 