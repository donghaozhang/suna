# Backend Tests

This directory contains test scripts for the Suna backend functionality.

## Test Files

### `check_projects.py`
- **Purpose**: Verify database connectivity and list available projects
- **Usage**: `python backend/tests/check_projects.py`
- **Description**: Connects to Supabase and retrieves the first 5 projects to verify database access

### `test_fal_tool.py`
- **Purpose**: Test the `fal_media_generation` tool directly
- **Usage**: `python backend/tests/test_fal_tool.py`
- **Description**: Tests image generation with enhanced error handling, validates the tool's ability to generate images and handle save failures gracefully

### `test_image_generation.py`
- **Purpose**: End-to-end API testing for image generation
- **Usage**: `python backend/tests/test_image_generation.py`
- **Description**: Tests the complete image generation flow through the API endpoints (requires authentication)

## Running Tests

### Local Development
```bash
# From the project root
cd backend/tests

# Test database connectivity
python check_projects.py

# Test fal_media_tool directly
python test_fal_tool.py

# Test API endpoints (requires running backend)
python test_image_generation.py
```

### Docker Environment
```bash
# Copy test file to container and run
docker compose cp backend/tests/test_fal_tool.py worker:/app/test_fal_tool.py
docker compose exec worker python /app/test_fal_tool.py

# Or run from host with proper environment
docker compose exec worker python -c "
import sys; sys.path.append('/app')
exec(open('/app/backend/tests/test_fal_tool.py').read())
"
```

## Test Requirements

- **Environment Variables**: Ensure `.env` file is properly configured
- **Dependencies**: All backend dependencies must be installed
- **Services**: For API tests, ensure backend, worker, and database services are running

## Expected Outcomes

### `check_projects.py`
- Should list available projects from the database
- Verifies Supabase connection is working

### `test_fal_tool.py`
- Should generate an image successfully
- Should demonstrate enhanced error handling when workspace saving fails
- Should provide detailed error messages and fallback URLs

### `test_image_generation.py`
- Should test the complete API flow
- Requires proper authentication setup
- Tests thread creation, message addition, and agent execution 