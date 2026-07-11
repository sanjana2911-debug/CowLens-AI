"""
YOLOv11 inference module for cow disease detection.
Handles model loading, prediction, and annotation.
"""
import os
import cv2
import numpy as np
from PIL import Image
import io
import base64
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Disease classes that YOLO model is trained to detect
# These map to common cattle diseases/conditions visible in images
DISEASE_CLASSES = {
    0: "Foot_and_Mouth_Disease",
    1: "Bovine_Respiratory_Disease",
    2: "Mastitis",
    3: "Lumpy_Skin_Disease",
    4: "Bovine_Tuberculosis",
    5: "Actinomycosis_Lumpy_Jaw",
    6: "Dermatophilosis",
    7: "Eye_Infection",
    8: "Skin_Lesion",
    9: "Injury_Wound",
    10: "Malnutrition",
    11: "Parasitic_Infestation",
    12: "Healthy",
}

# Confidence threshold for detections
CONFIDENCE_THRESHOLD = 0.25
# NMS IoU threshold
IOU_THRESHOLD = 0.45


def load_model(weights_path: str):
    """
    Load YOLOv11 model from weights file.
    Falls back to a pretrained model if custom weights not available.
    """
    try:
        from ultralytics import YOLO

        weights_file = Path(weights_path)
        if weights_file.exists():
            logger.info(f"Loading custom YOLO model from {weights_path}")
            model = YOLO(str(weights_file))
        else:
            logger.warning(
                f"Weights file not found at {weights_path}. "
                "Using pretrained YOLOv11n model. "
                "For production, train a custom model on cattle disease data."
            )
            # Use pretrained YOLO model as fallback
            model = YOLO("yolo11n.pt")
            logger.info("Loaded pretrained YOLOv11n model")

        return model
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
        raise


def predict_diseases(model, image_bytes: bytes):
    """
    Run YOLOv11 inference on the input image.
    Returns detections with bounding boxes, confidence scores, and disease labels.
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Failed to decode image")

        original_height, original_width = img.shape[:2]

        # Run inference
        results = model(
            img,
            conf=CONFIDENCE_THRESHOLD,
            iou=IOU_THRESHOLD,
            verbose=False,
        )

        detections = []
        annotated_image = None

        for result in results:
            boxes = result.boxes
            if boxes is not None and len(boxes) > 0:
                for i in range(len(boxes)):
                    x1, y1, x2, y2 = boxes.xyxy[i].tolist()
                    confidence = float(boxes.conf[i])
                    class_id = int(boxes.cls[i])

                    disease_name = DISEASE_CLASSES.get(
                        class_id, f"Unknown_Condition_{class_id}"
                    )

                    detections.append({
                        "disease": disease_name.replace("_", " "),
                        "confidence": round(confidence * 100, 2),
                        "boundingBox": {
                            "x1": round(x1, 2),
                            "y1": round(y1, 2),
                            "x2": round(x2, 2),
                            "y2": round(y2, 2),
                            "width": round(x2 - x1, 2),
                            "height": round(y2 - y1, 2),
                        },
                        "classId": class_id,
                    })

            # Get annotated image
            annotated_img = result.plot()
            annotated_image = annotated_img

        # If no detections, use original image
        if annotated_image is None:
            annotated_image = img

        # Sort detections by confidence (highest first)
        detections.sort(key=lambda x: x["confidence"], reverse=True)

        # Aggregate unique diseases with max confidence
        unique_diseases = {}
        for det in detections:
            disease = det["disease"]
            if disease not in unique_diseases or det["confidence"] > unique_diseases[disease]["confidence"]:
                unique_diseases[disease] = {
                    "disease": disease,
                    "confidence": det["confidence"],
                    "boundingBox": det["boundingBox"],
                }

        aggregated = list(unique_diseases.values())
        aggregated.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "detectedDiseases": [d["disease"] for d in aggregated],
            "detections": aggregated,
            "boundingBoxes": [d["boundingBox"] for d in detections],
            "rawDetections": detections,
            "annotatedImage": annotated_image,
            "imageWidth": original_width,
            "imageHeight": original_height,
            "totalDetections": len(detections),
        }

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise


def encode_image_to_bytes(image_array: np.ndarray, format: str = ".jpg") -> bytes:
    """Encode numpy array image to bytes."""
    success, buffer = cv2.imencode(format, image_array)
    if not success:
        raise ValueError("Failed to encode image")
    return buffer.tobytes()


def get_disease_severity(disease_name: str) -> str:
    """Map disease to severity level for Groq integration."""
    high_severity = [
        "Foot and Mouth Disease",
        "Bovine Tuberculosis",
        "Lumpy Skin Disease",
        "Bovine Respiratory Disease",
    ]
    medium_severity = [
        "Mastitis",
        "Actinomycosis Lumpy Jaw",
        "Parasitic Infestation",
    ]
    low_severity = [
        "Dermatophilosis",
        "Eye Infection",
        "Skin Lesion",
        "Injury Wound",
        "Malnutrition",
    ]

    if disease_name in high_severity:
        return "high"
    elif disease_name in medium_severity:
        return "medium"
    elif disease_name in low_severity:
        return "low"
    return "medium"


def get_disease_category(disease_name: str) -> str:
    """Map disease to category for Groq integration."""
    category_map = {
        "Foot and Mouth Disease": "infectious",
        "Bovine Respiratory Disease": "respiratory",
        "Mastitis": "infectious",
        "Lumpy Skin Disease": "infectious",
        "Bovine Tuberculosis": "respiratory",
        "Actinomycosis Lumpy Jaw": "infectious",
        "Dermatophilosis": "infectious",
        "Eye Infection": "infectious",
        "Skin Lesion": "injury",
        "Injury Wound": "injury",
        "Malnutrition": "nutritional",
        "Parasitic Infestation": "parasitic",
        "Healthy": "other",
    }
    return category_map.get(disease_name, "other")