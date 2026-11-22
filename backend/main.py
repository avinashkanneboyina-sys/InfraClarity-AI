"""
InfraClarity AI - FastAPI REST API Server
Industrial AI Inspection Image Restoration Platform for Energy & Utilities.
"""

import os
import io
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel

from image_processor import ImageProcessor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
SAMPLE_DIR = os.path.join(BASE_DIR, "sample_images")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(SAMPLE_DIR, exist_ok=True)

processor = ImageProcessor(upload_dir=UPLOAD_DIR, output_dir=OUTPUT_DIR)

app = FastAPI(
    title="InfraClarity AI",
    description="Generative AI & Deep Learning Infrastructure Inspection Image Restoration API",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folders for image previews
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")
app.mount("/sample_images", StaticFiles(directory=SAMPLE_DIR), name="sample_images")


# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================

class EnhanceRequest(BaseModel):
    image_id: str
    operation: str
    params: Optional[Dict[str, Any]] = None

class AnalyzeRequest(BaseModel):
    image_id: str
    context: Optional[str] = None

class CompareRequest(BaseModel):
    image_id: str


# ==============================================================================
# REST ENDPOINTS
# ==============================================================================

@app.get("/health")
def health_check():
    """Health and runtime environment diagnostic check."""
    import torch
    return {
        "status": "healthy",
        "service": "InfraClarity AI Backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "runtime": {
            "torch_available": True,
            "torch_version": torch.__version__,
            "cuda_available": torch.cuda.is_available(),
            "device": "cuda" if torch.cuda.is_available() else "cpu",
            "active_images_count": len(processor.history)
        }
    }


@app.get("/samples")
def get_sample_images():
    """Returns curated industrial utility inspection sample images for testing."""
    samples = [
        {
            "id": "transmission_tower_blur",
            "name": "Electrical Transmission Lattice Tower",
            "filename": "transmission_tower_blur.jpg",
            "url": "/sample_images/transmission_tower_blur.jpg",
            "domain": "Electrical Transmission & Distribution",
            "degradation": "Motion blur from drone camera vibration & atmospheric haze",
            "recommended_technique": "deblur",
            "recommended_label": "Richardson-Lucy AI Deblurring"
        },
        {
            "id": "pipeline_lowlight",
            "name": "Oil & Gas Pipeline Weld & Flange",
            "filename": "pipeline_lowlight.jpg",
            "url": "/sample_images/pipeline_lowlight.jpg",
            "domain": "Oil & Gas Midstream Pipeline",
            "degradation": "Severe underexposure, trench shadow & low dynamic range",
            "recommended_technique": "low_light",
            "recommended_label": "Zero-DCE Adaptive Curve Illumination"
        },
        {
            "id": "powerline_noise",
            "name": "Overhead Conductor Lines & Insulators",
            "filename": "powerline_noise.jpg",
            "url": "/sample_images/powerline_noise.jpg",
            "domain": "High-Voltage Transmission Grid",
            "degradation": "High-ISO dusk sensor grain, salt-and-pepper noise",
            "recommended_technique": "denoise",
            "recommended_label": "DnCNN Deep Residual Denoising"
        },
        {
            "id": "substation_lowcontrast",
            "name": "Substation Power Transformer",
            "filename": "substation_lowcontrast.jpg",
            "url": "/sample_images/substation_lowcontrast.jpg",
            "domain": "Substation & Switchgear Assets",
            "degradation": "Overcast weather fog, flattened contrast & surface haze",
            "recommended_technique": "contrast",
            "recommended_label": "CLAHE on CIE L*a*b* Luminance"
        },
        {
            "id": "solar_array_lowres",
            "name": "Photovoltaic Solar Utility Array",
            "filename": "solar_array_lowres.jpg",
            "url": "/sample_images/solar_array_lowres.jpg",
            "domain": "Renewable Solar Energy Assets",
            "degradation": "Sub-Nyquist low spatial resolution, pixelated cell busbars",
            "recommended_technique": "super_resolution",
            "recommended_label": "Real-ESRGAN x4 Deep Super-Resolution"
        }
    ]
    return {"samples": samples}


@app.post("/load-sample/{sample_id}")
def load_sample_image(sample_id: str):
    """Loads a built-in sample infrastructure image into the workspace."""
    sample_file = f"{sample_id}.jpg"
    src_path = os.path.join(SAMPLE_DIR, sample_file)
    if not os.path.exists(src_path):
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")

    with open(src_path, "rb") as f:
        bytes_data = f.read()

    record = processor.register_upload(filename=sample_file, image_bytes=bytes_data)
    return {"success": True, "message": f"Sample '{sample_id}' loaded into studio.", "record": record}


@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    reference: Optional[UploadFile] = File(None)
):
    """
    Validates and registers inspection image uploads (JPG, JPEG, PNG).
    Optionally accepts a Ground Truth reference image for true PSNR/SSIM calculation.
    """
    filename = file.filename or "upload.jpg"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".jpg", ".jpeg", ".png"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Only JPG, JPEG, and PNG are permitted."
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Max file size: 25 MB
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 25MB limit.")

    try:
        record = processor.register_upload(filename=filename, image_bytes=content)

        # Handle optional reference image
        if reference is not None:
            ref_bytes = await reference.read()
            if len(ref_bytes) > 0:
                ref_filename = f"ref_{record['image_id']}{os.path.splitext(reference.filename)[1]}"
                ref_path = os.path.join(UPLOAD_DIR, ref_filename)
                with open(ref_path, "wb") as rf:
                    rf.write(ref_bytes)
                record["reference_path"] = ref_path
                record["reference_url"] = f"/uploads/{ref_filename}"
                processor._save_history()

        return {"success": True, "record": record}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload processing failed: {str(e)}")


@app.post("/enhance")
async def enhance_image_endpoint(
    image_id: str = Form(...),
    operation: str = Form(...),
    params: Optional[str] = Form(None),
    reference_file: Optional[UploadFile] = File(None)
):
    """
    Executes specified restoration technique on the uploaded image.
    Operations:
      - 'denoise': Denoising (DnCNN / Fast NLM / Bilateral)
      - 'deblur': Deblurring (Richardson-Lucy / Unsharp / Wiener)
      - 'low_light': Low-Light Illumination (Zero-DCE / Retinex)
      - 'contrast': Contrast Enhancement (CLAHE L*a*b* / Sigmoid)
      - 'super_resolution': Real-ESRGAN (x2 / x4 RRDBNet)
      - 'diffusion': Generative Diffusion Restoration (Conditional UNet + Reverse Sampling)
    """
    param_dict = {}
    if params:
        try:
            param_dict = json.loads(params)
        except Exception:
            param_dict = {}

    ref_bytes = None
    if reference_file is not None:
        ref_bytes = await reference_file.read()

    try:
        updated_record = processor.enhance_image(
            image_id=image_id,
            operation=operation,
            params=param_dict,
            reference_image_bytes=ref_bytes
        )
        return {"success": True, "record": updated_record}
    except FileNotFoundError as fe:
        raise HTTPException(status_code=404, detail=str(fe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhancement execution error: {str(e)}")


@app.post("/analyze")
def analyze_image_endpoint(payload: AnalyzeRequest):
    """
    Runs Vision-Language model analysis on the image:
    - Component identification
    - Quantitative image degradation diagnosis
    - Inspection-oriented visual summary
    """
    try:
        analysis = processor.analyze_image(image_id=payload.image_id, context=payload.context)
        record = processor.get_image_record(payload.image_id)
        return {"success": True, "analysis": analysis, "record": record}
    except FileNotFoundError as fe:
        raise HTTPException(status_code=404, detail=str(fe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VLM Analysis error: {str(e)}")


@app.post("/compare")
def compare_images_endpoint(payload: CompareRequest):
    """
    Retrieves full side-by-side comparison data, dimensions, processing time,
    and quality metrics for interactive split-slider viewing.
    """
    record = processor.get_image_record(payload.image_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Image {payload.image_id} not found.")

    if not record.get("enhanced_url"):
        raise HTTPException(status_code=400, detail="Image has not been enhanced yet.")

    return {
        "image_id": record["image_id"],
        "original_url": record["upload_url"],
        "enhanced_url": record["enhanced_url"],
        "original_dimensions": record["dimensions"],
        "enhanced_dimensions": record.get("metrics", {}).get("dimensions", {}).get("enhanced"),
        "processing_time_ms": record.get("processing_time_ms", 0.0),
        "last_operation": record.get("last_operation"),
        "model_used": record.get("model_used"),
        "is_generative_ai": record.get("is_generative_ai", False),
        "metrics": record.get("metrics"),
        "analysis": record.get("analysis")
    }


@app.get("/history")
def get_processing_history():
    """Returns chronological processing history and platform statistics."""
    total = len(processor.history)
    enhanced_count = sum(1 for r in processor.history if r.get("enhanced_url") is not None)
    generative_count = sum(1 for r in processor.history if r.get("is_generative_ai"))

    return {
        "stats": {
            "total_processed": total,
            "successful_enhancements": enhanced_count,
            "generative_enhancements": generative_count,
            "conventional_enhancements": enhanced_count - generative_count
        },
        "records": processor.history
    }


@app.delete("/history")
def clear_processing_history():
    """Clears all processing history records while preserving stored image files and models."""
    count = processor.clear_history()
    return {
        "success": True,
        "message": f"Successfully cleared {count} processing history records.",
        "stats": {
            "total_processed": 0,
            "successful_enhancements": 0,
            "generative_enhancements": 0,
            "conventional_enhancements": 0
        },
        "records": []
    }


@app.get("/download/{image_id}")
def download_enhanced_image(image_id: str):
    """Downloads the enhanced inspection image preserving its file format."""
    record = processor.get_image_record(image_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found.")

    target_path = record.get("enhanced_path") or record.get("original_path")
    if not target_path or not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="File not found on storage.")

    filename = os.path.basename(target_path)
    return FileResponse(
        path=target_path,
        media_type="image/jpeg" if filename.lower().endswith(".jpg") else "image/png",
        filename=f"infraclarity_{filename}"
    )


@app.get("/report/{image_id}")
def download_inspection_report(image_id: str):
    """Generates and downloads a structured inspection summary report."""
    record = processor.get_image_record(image_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found.")

    analysis = record.get("analysis")
    metrics = record.get("metrics")

    # Generate Markdown Inspection Dossier
    lines = [
        "# InfraClarity AI – Infrastructure Inspection Dossier",
        f"**Inspection Dossier ID:** `{record['image_id']}`  ",
        f"**Original Image File:** `{record['original_filename']}`  ",
        f"**Generation Date (UTC):** `{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}`  ",
        f"**Model Architecture:** `{record.get('model_used', 'N/A')}`  ",
        f"**Processing Latency:** `{record.get('processing_time_ms', 0.0)} ms`  ",
        "",
        "---",
        "",
        "## 1. Asset Classification & Domain",
    ]

    if analysis:
        asset_info = analysis.get("asset_classification", {})
        lines.append(f"- **Identified Asset:** {asset_info.get('primary_asset', 'Utility Equipment')}")
        lines.append(f"- **Domain:** {asset_info.get('asset_domain', 'Energy & Utilities')}")
        lines.append(f"- **VLM Confidence:** {asset_info.get('confidence', 0.0)*100:.1f}%\n")

        lines.append("## 2. Identified Visible Components")
        for comp in analysis.get("visible_components", []):
            lines.append(f"- **{comp['component']}** ({comp['status']}): {comp['description']}")
        lines.append("")

        lines.append("## 3. Optical Degradation & Quality Deficiencies")
        for q in analysis.get("image_quality_problems", []):
            lines.append(f"- **{q['issue']}** [{q['severity']} Severity]: {q['impact']} (Metric: {q['metrics']})")
        lines.append("")

        lines.append("## 4. Visual Inspection Summary")
        lines.append(analysis.get("inspection_summary", "No summary generated."))
        lines.append("")
    else:
        lines.append("Visual Language analysis not executed for this image.\n")

    lines.append("## 5. Image Quality Assessment Metrics")
    if metrics:
        nr = metrics.get("no_reference_metrics", {})
        enh = nr.get("enhanced", {})
        orig = nr.get("original", {})
        chg = nr.get("relative_change", {})
        lines.append("| Metric Parameter | Original Capture | Enhanced Result | Delta Change |")
        lines.append("| :--- | :--- | :--- | :--- |")
        lines.append(f"| Laplacian Sharpness | {orig.get('sharpness_laplacian', '-')} | {enh.get('sharpness_laplacian', '-')} | +{chg.get('sharpness_gain_pct', 0)}% |")
        lines.append(f"| RMS Contrast | {orig.get('rms_contrast_pct', '-')}% | {enh.get('rms_contrast_pct', '-')}% | {chg.get('contrast_change_pct', 0)}% |")
        lines.append(f"| Estimated Noise Sigma | {orig.get('estimated_noise_sigma', '-')} | {enh.get('estimated_noise_sigma', '-')} | {chg.get('noise_reduction_pct', 0)}% reduction |")
        lines.append(f"| Shannon Entropy | {orig.get('shannon_entropy_bits', '-')} bits | {enh.get('shannon_entropy_bits', '-')} bits | {chg.get('entropy_gain_pct', 0)}% |")
        lines.append("")

        fr = metrics.get("full_reference_metrics", {})
        if fr.get("reference_available"):
            lines.append(f"**Ground Truth Reference Metrics:** PSNR: {fr.get('psnr')} dB | SSIM: {fr.get('ssim')}\n")
        else:
            lines.append(f"> **Full-Reference Note:** {fr.get('explanation')}\n")

    lines.append("---")
    lines.append("## 6. Safety, Integrity & Regulatory Compliance Notice")
    if record.get("is_generative_ai"):
        lines.append(
            "> [!WARNING] **GENERATIVE AI RESTORATION ADVISORY**  \n"
            "> This enhancement utilized Generative Diffusion. Generative restoration synthesizes plausible high-frequency "
            "> textures and can hallucinate details. This enhanced output is for visual assistance only and MUST NOT "
            "> replace original raw captures for legal or structural integrity certification."
        )
    lines.append(
        "> [!IMPORTANT] **DEFECT DETECTION DISCLAIMER**  \n"
        "> In accordance with engineering standards, this system performs visual quality enhancement and component "
        "> identification. It DOES NOT detect or certify structural defects (cracks, metal fatigue, dielectric punctures). "
        "> Formal engineering sign-off requires qualified inspection personnel or validated Non-Destructive Testing (NDT)."
    )

    content = "\n".join(lines)
    return PlainTextResponse(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=inspection_report_{image_id}.md"}
    )
