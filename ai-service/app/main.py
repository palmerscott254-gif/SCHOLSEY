from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
from .analyzers.ai_detector import AIDetector
from .analyzers.edit_detector import EditDetector
from .analyzers.metadata_analyzer import MetadataAnalyzer
from .models.analysis_result import AnalysisResult
import time
import os
import asyncio
import io
from PIL import Image, UnidentifiedImageError

CURRENT_DIR = os.path.dirname(__file__)
SERVICE_ROOT = os.path.dirname(CURRENT_DIR)

load_dotenv(os.path.join(SERVICE_ROOT, '.env'))
load_dotenv(os.path.join(CURRENT_DIR, '.env'))

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", "15728640"))  # 15MB
MAX_IMAGE_PIXELS = int(os.getenv("MAX_IMAGE_PIXELS", "48000000"))  # ~48MP
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

# Initialize analyzers
ai_detector = None
edit_detector = None
metadata_analyzer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global ai_detector, edit_detector, metadata_analyzer
    print("🚀 Loading AI models...")
    
    ai_detector = AIDetector()
    edit_detector = EditDetector()
    metadata_analyzer = MetadataAnalyzer()
    
    await ai_detector.load_model()
    await edit_detector.load_model()
    
    print("✅ AI models loaded successfully")
    yield
    # Shutdown
    print("🛑 Shutting down AI service...")

app = FastAPI(
    title="Device Tracker AI Analysis Service",
    description="AI-powered image authenticity analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "Device Tracker AI Analysis",
        "version": "1.0.0",
        "status": "operational",
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "ai_detector": ai_detector is not None,
            "edit_detector": edit_detector is not None,
            "metadata_analyzer": metadata_analyzer is not None,
        }
    }

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an image for AI generation, manipulation, and authenticity.
    
    Returns:
        - AI generation probability
        - Edit detection results
        - Metadata anomalies
        - Authenticity score
        - Detailed report
    """
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    start_time = time.time()
    
    try:
        # Read image data
        image_data = await file.read()

        if not image_data:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        if len(image_data) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Image exceeds maximum allowed size of {MAX_UPLOAD_BYTES // (1024 * 1024)}MB"
            )

        # Validate image decode early (prevents malformed payloads)
        try:
            with Image.open(io.BytesIO(image_data)) as image:
                image.verify()
        except (UnidentifiedImageError, OSError):
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file")
        
        # Run analyzers concurrently for lower latency
        ai_result, edit_result, metadata_result = await asyncio.gather(
            ai_detector.analyze(image_data),
            edit_detector.analyze(image_data),
            metadata_analyzer.analyze(image_data),
        )
        
        # Calculate overall authenticity score
        authenticity_score = calculate_authenticity_score(
            ai_result, edit_result, metadata_result
        )
        
        # Determine confidence level
        confidence_level = determine_confidence(authenticity_score)
        
        # Generate explanation
        explanation = generate_explanation(ai_result, edit_result, metadata_result)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return AnalysisResult(
            is_ai_generated=ai_result["is_ai_generated"],
            ai_probability=ai_result["probability"],
            is_edited=edit_result["is_edited"],
            edit_probability=edit_result["probability"],
            authenticity_score=authenticity_score,
            confidence_level=confidence_level,
            metadata_anomalies=metadata_result,
            lighting_inconsistencies=edit_result["lighting_analysis"],
            compression_artifacts=edit_result["compression_analysis"],
            explanation=explanation,
            detailed_report={
                "ai_detection": ai_result,
                "edit_detection": edit_result,
                "metadata": metadata_result,
            },
            processing_time_ms=processing_time,
            model_version="1.3.0",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def calculate_authenticity_score(ai_result, edit_result, metadata_result):
    """Calculate overall authenticity score (0-1)"""
    # Weight different factors
    ai_weight = 0.4
    edit_weight = 0.3
    metadata_weight = 0.3
    
    ai_score = 1.0 - ai_result["probability"]
    edit_score = 1.0 - edit_result["probability"]
    metadata_score = 1.0 - metadata_result["anomaly_score"]
    
    overall_score = (
        ai_score * ai_weight +
        edit_score * edit_weight +
        metadata_score * metadata_weight
    )
    
    return round(overall_score, 4)

def determine_confidence(score):
    """Determine confidence level based on score"""
    if score >= 0.8:
        return "high"
    elif score >= 0.5:
        return "medium"
    else:
        return "low"

def generate_explanation(ai_result, edit_result, metadata_result):
    """Generate human-readable explanation"""
    explanations = []
    
    if ai_result["is_ai_generated"]:
        explanations.append(
            f"High probability ({ai_result['probability']:.1%}) of AI generation detected."
        )
    
    if edit_result["is_edited"]:
        explanations.append(
            f"Image shows signs of editing ({edit_result['probability']:.1%} confidence)."
        )
    
    if metadata_result["found"]:
        explanations.append(
            f"Metadata anomalies detected: {', '.join(metadata_result['issues'][:3])}."
        )
    
    if not explanations:
        explanations.append("Image appears to be authentic with no major concerns.")
    
    return " ".join(explanations)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
