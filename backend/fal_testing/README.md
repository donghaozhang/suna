# fal.ai API Test Scripts

This directory contains test scripts to verify your fal.ai API integration is working correctly.

## Directory Structure

```
backend/fal_testing/
├── README.md                    # This file
├── test_fal_simple.py          # Quick basic test
├── test_fal_api.py             # Comprehensive async test
├── test_suna_fal_tool.py       # Suna integration test
└── images/                     # Generated test images
    └── fal_generated_*.png     # Auto-generated images
```

## Prerequisites

1. **Get a fal.ai API key**:
   - Sign up at [fal.ai](https://fal.ai)
   - Get your API key from the dashboard

2. **Install dependencies**:
   ```bash
   pip install fal-client python-dotenv requests
   ```

3. **API key is automatically loaded** from `backend/.env`:
   ```env
   FAL_KEY=your_fal_api_key_here
   ```

## Test Scripts

### 1. `test_fal_simple.py` - Quick Basic Test

The simplest test to verify your setup works:

```bash
cd backend/fal_testing
python test_fal_simple.py
```

**What it does:**
- Checks if FAL_KEY is set
- Generates a simple image using FLUX Schnell (fastest model)
- Shows the generated image URL

**Expected output:**
```
🧪 Simple fal.ai API Test
==============================
✅ API Key found: fal-1234...
🎨 Generating image with prompt: 'A red apple on a wooden table'
📱 Using model: fal-ai/flux/schnell
✅ Success! Image generated.
📋 Response keys: ['images']
🖼️  Image URL: https://fal.media/files/...
```

### 2. `test_fal_api.py` - Comprehensive Test

More detailed testing with multiple models:

```bash
cd backend/fal_testing
python test_fal_api.py
```

**What it does:**
- Tests basic image generation
- Tests multiple fal.ai models
- Shows detailed error information
- Tests advanced parameters (seed, image size, etc.)

### 3. `test_suna_fal_tool.py` - Suna Integration Test

Tests the Suna project's fal media tool:

```bash
cd backend/fal_testing
python test_suna_fal_tool.py
```

**What it does:**
- Tests the FalMediaTool class from Suna
- Verifies the tool integration works
- Tests with the underwater Sanxingdui prompt (like in your conversation)

## Troubleshooting

### Common Issues

1. **"FAL_KEY environment variable not set"**
   ```bash
   export FAL_KEY=your_actual_api_key
   ```

2. **"fal_client not found"**
   ```bash
   pip install fal-client
   ```

3. **Import errors for Suna tool test**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   python test_suna_fal_tool.py
   ```

4. **API errors**
   - Check your API key is valid
   - Verify you have credits in your fal.ai account
   - Try a different model if one fails

### Available Models

The scripts test these fal.ai models:

- `fal-ai/flux/schnell` - Fast generation (recommended for testing)
- `fal-ai/flux/dev` - High quality
- `fal-ai/stable-diffusion-xl` - Classic Stable Diffusion
- `fal-ai/stable-diffusion-v3-medium` - Latest SD3
- `fal-ai/photorealism` - Photorealistic images

## Integration with Suna

Once your tests pass, you can use fal.ai in Suna by:

1. **Setting the API key in your backend `.env`**:
   ```env
   FAL_KEY=your_fal_api_key
   ```

2. **Selecting a fal.ai model in the frontend**:
   - Use the media model selector
   - Choose any model starting with "fal-ai/"

3. **The agent will automatically use fal.ai** instead of searching for free alternatives

## Example Usage

```python
# Simple direct usage
import fal_client

result = fal_client.run(
    "fal-ai/flux/schnell",
    arguments={
        "prompt": "A beautiful landscape",
        "image_size": "landscape_4_3",
        "num_images": 1
    }
)

print(result["images"][0]["url"])
```

## Need Help?

- Check the [fal.ai documentation](https://docs.fal.ai/)
- Verify your API key at [fal.ai dashboard](https://fal.ai/dashboard)
- Make sure you have sufficient credits 