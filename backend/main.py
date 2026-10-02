import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.rest_routes import rest_router
from app.api.websocket_routes import ws_router
from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("phishguard.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-time Web System for AI Synthetic Voice & Deepfake Detection with Forensic SHA-256 Auditability"
)

# Enable CORS for frontend Vite client and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST and WebSocket routes
app.include_router(rest_router, prefix=settings.API_PREFIX, tags=["Forensic & Analysis"])
app.include_router(ws_router, tags=["Real-time Stream"])

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "sample_rate": settings.TARGET_SAMPLE_RATE,
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "timestamp": time.time()
    }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
