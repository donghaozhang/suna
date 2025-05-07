from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from agentpress.thread_manager import ThreadManager
from services.supabase import DBConnection
from datetime import datetime, timezone
from dotenv import load_dotenv
from utils.config import config, EnvMode
import asyncio
from utils.logger import logger
import uuid
import time
from collections import OrderedDict

# Import the agent API module
from agent import api as agent_api
from sandbox import api as sandbox_api
from services import billing as billing_api
from services import db_fixes

# Load environment variables (these will be available through config)
load_dotenv()

# Initialize managers
db = DBConnection()
thread_manager = None
instance_id = "single"

# Rate limiting
call_rates = {}
MAX_CALLS_PER_MINUTE = 60
COOLDOWN_PERIOD_SECONDS = 30

# For tracking DB pool initialization
is_initialized = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB connection before the app starts
    global db, thread_manager, is_initialized
    await db.initialize()
    
    # Initialize thread manager
    thread_manager = ThreadManager()
    
    # Initialize agent API with resources
    agent_api.initialize(thread_manager, db, instance_id)
    
    is_initialized = True
    
    yield
    
    # Cleanup agent API
    await agent_api.cleanup()
    
    # Cleanup when the app is shutting down
    await db.disconnect()

app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow any origin for now, can be restricted later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the agent API router
app.include_router(agent_api.router, prefix="/api", tags=["agent"])

# Register the sandbox API router
app.include_router(sandbox_api.router, prefix="/api/sandbox", tags=["sandbox"])

# Register the billing API router
app.include_router(billing_api.router, prefix="/api/billing", tags=["billing"])

# Register the db_fixes router
app.include_router(db_fixes.router, prefix="/api", tags=["db-fixes"])

async def check_rate_limit(request: Request):
    # Skip rate limiting in development mode
    if config.ENV_MODE == EnvMode.LOCAL:
        return True, 0
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Get current time
    current_time = time.time()
    
    # Get or create call history for this IP
    if client_ip not in call_rates:
        call_rates[client_ip] = OrderedDict()
    
    # Remove old timestamps
    while call_rates[client_ip] and list(call_rates[client_ip].keys())[0] < current_time - 60:
        call_rates[client_ip].popitem(last=False)
    
    # Count calls in the last minute
    calls_in_last_minute = len(call_rates[client_ip])
    
    # Check if exceeded rate limit
    if calls_in_last_minute >= MAX_CALLS_PER_MINUTE:
        # Get oldest timestamp
        oldest_timestamp = list(call_rates[client_ip].keys())[0]
        cooldown_time = oldest_timestamp + 60 - current_time
        
        return False, cooldown_time
    
    # Record this call
    call_rates[client_ip][current_time] = True
    
    return True, 0

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for certain paths
    if request.url.path in ["/", "/api/health", "/docs", "/openapi.json"]:
        return await call_next(request)
    
    # Check rate limit
    allowed, cooldown_time = await check_rate_limit(request)
    
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={
                "detail": f"Rate limit exceeded. Try again in {cooldown_time:.1f} seconds."
            },
        )
    
    response = await call_next(request)
    return response

@app.middleware("http")
async def db_initialization_middleware(request: Request, call_next):
    global is_initialized
    
    # Skip for health check
    if request.url.path == "/api/health":
        return await call_next(request)
    
    # If DB is not initialized, wait for a bit
    timeout = 10  # 10 seconds timeout
    start_time = time.time()
    while not is_initialized and time.time() - start_time < timeout:
        await asyncio.sleep(0.5)
    
    if not is_initialized:
        return JSONResponse(
            status_code=503,
            content={"detail": "Database initialization in progress. Please try again later."}
        )
    
    return await call_next(request)

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for the API
    Returns basic health information and config
    """
    return {
        "status": "ok",
        "instance": instance_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": config.ENV_MODE.value,
        "db_initialized": is_initialized
    }

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)