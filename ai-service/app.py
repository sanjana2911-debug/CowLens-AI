"""
FastAPI inference server for YOLOv11 cow disease detection and cow presence detection.
Provides REST API for image-based disease detection and cow verification.
"""
import os
import io
import logging
import uuid
from pathlib import Path
from typing import Optional

import cloudinary
import cloudinary.uploader
import cv2
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from predict import load_model, predict_diseases, encode_image_to_bytes, detect_cow_in_image

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Configuration
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))
WEIGHTS_PATH = os.getenv("WEIGHTS_PATH", "weights/best.pt")
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Configure Cloudinary
if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
    )
    logger.info("Cloudinary configured for annotated image uploads")
else:
    logger.warning("Cloudinary not configured. Annotated images will not be uploaded to cloud.")

# Initialize FastAPI
app = FastAPI(
    title="CowLens AI - YOLOv11 Disease Detection & Cow Verification Service",
    description="AI-powered cattle disease detection and cow presence verification using YOLOv11",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
model = None


def get_model():
    """Lazy-load the YOLO model."""
    global model
    if model is None:
        weights_path = Path(WEIGHTS_PATH)
        logger.info(f"Loading YOLO model from {weights_path}")
        model = load_model(str(weights_path))
        logger.info("YOLO model loaded successfully")
    return model


def validate_image(file: UploadFile) -> bytes:
    """Validate uploaded image file."""
    # Check file extension
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content
    contents = file.file.read()

    # Check file size
    max_size = MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_IMAGE_SIZE_MB}MB",
        )

    # Verify it's a valid image
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file. Could not decode image.",
        )

    return contents


def upload_to_cloudinary(image_bytes: bytes, public_id: Optional[str] = None) -> Optional[str]:
    """Upload annotated image to Cloudinary and return URL."""
    if not CLOUDINARY_CLOUD_NAME:
        return None

    try:
        if public_id is None:
            public_id = f"cowlens-ai/annotated/{uuid.uuid4().hex}"

        result = cloudinary.uploader.upload(
            io.BytesIO(image_bytes),
            public_id=public_id,
            folder="cowlens-ai/annotated",
            resource_type="image",
            overwrite=True,
        )
        logger.info(f"Annotated image uploaded to Cloudinary: {result['secure_url']}")
        return result["secure_url"]
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        return None


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "cowlens-ai-yolo",
        "model_loaded": model is not None,
    }


@app.post("/detect-cow")
async def detect_cow(file: UploadFile = File(...)):
    """
    Upload an image and verify if it contains a cow.
    Only detects the COCO class 'cow' (class ID 0).
    Ignores all other objects (person, dog, cat, horse, etc.).
    
    Returns:
        If a cow is detected:
        {
            "success": true,
            "isCow": true,
            "confidence": 96.4,
            "detections": []
        }
        
        If no cow is detected:
        {
            "success": true,
            "isCow": false,
            "message": "Please upload a cow image."
        }
    """
    try:
        # Validate and read image
        image_bytes = validate_image(file)
        logger.info(f"Processing image for cow detection: {file.filename} ({len(image_bytes)} bytes)")

        # Get model and run cow detection
        yolo_model = get_model()
        result = detect_cow_in_image(yolo_model, image_bytes)

        if result["is_cow"]:
            logger.info(
                f"Cow detected in image: {file.filename} "
                f"(confidence: {result['confidence']}%)"
            )
            return {
                "success": True,
                "isCow": True,
                "confidence": result["confidence"],
                "detections": result["detections"],
            }
        else:
            logger.info(f"No cow detected in image: {file.filename}")
            return {
                "success": True,
                "isCow": False,
                "message": "Please upload a cow image.",
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cow detection failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Cow detection failed: {str(e)}",
        )


@app.post("/predict")
async def detect_diseases(file: UploadFile = File(...)):
    """
    Upload a cow image and get YOLOv11 disease detection results.
    
    Returns:
        - detectedDiseases: List of detected disease names
        - confidence: Confidence scores for each detection
        - boundingBoxes: Bounding box coordinates
        - annotatedImageUrl: URL of the annotated image (if Cloudinary configured)
        - rawDetections: Full detection details
    """
    try:
        # Validate and read image
        image_bytes = validate_image(file)
        logger.info(f"Processing image: {file.filename} ({len(image_bytes)} bytes)")

        # Get model and run prediction
        yolo_model = get_model()
        result = predict_diseases(yolo_model, image_bytes)

        # Extract annotated image
        annotated_image_array = result["annotatedImage"]
        annotated_bytes = encode_image_to_bytes(annotated_image_array)

        # Upload annotated image to Cloudinary
        annotated_image_url = upload_to_cloudinary(annotated_bytes)

        # Build response
        response = {
            "success": True,
            "data": {
                "detectedDiseases": result["detectedDiseases"],
                "detections": result["detections"],
                "confidence": (
                    result["detections"][0]["confidence"]
                    if result["detections"]
                    else 0
                ),
                "boundingBoxes": result["boundingBoxes"],
                "annotatedImageUrl": annotated_image_url,
                "imageWidth": result["imageWidth"],
                "imageHeight": result["imageHeight"],
                "totalDetections": result["totalDetections"],
            },
        }

        logger.info(
            f"Detection complete: {result['detectedDiseases']} "
            f"(confidence: {response['data']['confidence']}%)"
        )
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Disease detection failed: {str(e)}",
        )


@app.post("/predict/base64")
async def detect_diseases_base64(data: dict):
    """
    Alternative endpoint that accepts base64-encoded image.
    """
    try:
        import base64

        image_b64 = data.get("image")
        if not image_b64:
            raise HTTPException(status_code=400, detail="No image data provided")

        # Decode base64
        image_bytes = base64.b64decode(image_b64)

        # Validate size
        max_size = MAX_IMAGE_SIZE_MB * 1024 * 1024
        if len(image_bytes) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {MAX_IMAGE_SIZE_MB}MB",
            )

        # Validate image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Run prediction
        yolo_model = get_model()
        result = predict_diseases(yolo_model, image_bytes)

        # Upload annotated image
        annotated_bytes = encode_image_to_bytes(result["annotatedImage"])
        annotated_image_url = upload_to_cloudinary(annotated_bytes)

        return {
            "success": True,
            "data": {
                "detectedDiseases": result["detectedDiseases"],
                "detections": result["detections"],
                "confidence": (
                    result["detections"][0]["confidence"]
                    if result["detections"]
                    else 0
                ),
                "boundingBoxes": result["boundingBoxes"],
                "annotatedImageUrl": annotated_image_url,
                "imageWidth": result["imageWidth"],
                "imageHeight": result["imageHeight"],
                "totalDetections": result["totalDetections"],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Base64 detection failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Disease detection failed: {str(e)}",
        )


@app.get("/model/info")
async def model_info():
    """Get information about the loaded model."""
    try:
        yolo_model = get_model()
        return {
            "success": True,
            "data": {
                "model_type": type(yolo_model).__name__,
                "model_name": yolo_model.model_name if hasattr(yolo_model, "model_name") else "YOLOv11",
                "task": yolo_model.task if hasattr(yolo_model, "task") else "detect",
                "num_classes": len(yolo_model.names) if hasattr(yolo_model, "names") else 13,
                "class_names": list(yolo_model.names.values()) if hasattr(yolo_model, "names") else list(DISEASE_CLASSES.values()),
                "confidence_threshold": 0.25,
                "weights_path": WEIGHTS_PATH,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get model info: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting CowLens AI YOLO service on port {AI_SERVICE_PORT}")
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=AI_SERVICE_PORT,
        reload=True,
        log_level="info",
    )