"""
InfraClarity AI - Unified Image Processing & Pipeline Orchestration Module
Handles dispatching to conventional and generative AI restoration engines,
manages image persistence, executes performance timing, computes metrics,
and maintains in-memory and disk history records.
"""

import os
import uuid
import time
import json
import numpy as np
import cv2
from typing import Dict, Any, Optional, List
from datetime import datetime

from enhancement import denoise_image, deblur_image, enhance_low_light, enhance_contrast
from super_resolution import super_resolve_image
from diffusion_restoration import restore_with_diffusion
from image_analysis import analyze_inspection_image
from metrics import evaluate_image_metrics


class ImageProcessor:
    def __init__(self, upload_dir: str, output_dir: str):
        self.upload_dir = upload_dir
        self.output_dir = output_dir
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        self.history_file = os.path.join(self.output_dir, "history_records.json")
        self.history: List[Dict[str, Any]] = self._load_history()

    def _load_history(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, "r") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save_history(self):
        try:
            with open(self.history_file, "w") as f:
                json.dump(self.history, f, indent=2)
        except Exception:
            pass

    def clear_history(self) -> int:
        """Clears processing history records without deleting files from disk."""
        cleared_count = len(self.history)
        self.history = []
        self._save_history()
        return cleared_count

    def get_image_record(self, image_id: str) -> Optional[Dict[str, Any]]:
        for record in self.history:
            if record["image_id"] == image_id:
                return record
        return None

    def register_upload(self, filename: str, image_bytes: bytes) -> Dict[str, Any]:
        """Saves uploaded image safely and preserves original unedited file."""
        image_id = str(uuid.uuid4())
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png"]:
            ext = ".jpg"
        
        saved_filename = f"orig_{image_id}{ext}"
        saved_path = os.path.join(self.upload_dir, saved_filename)

        with open(saved_path, "wb") as f:
            f.write(image_bytes)

        # Read dimensions and properties with OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid or corrupted image file format.")

        h, w, c = img.shape
        file_size_kb = round(len(image_bytes) / 1024.0, 1)

        record = {
            "image_id": image_id,
            "original_filename": filename,
            "stored_filename": saved_filename,
            "original_path": saved_path,
            "upload_url": f"/uploads/{saved_filename}",
            "enhanced_url": None,
            "enhanced_path": None,
            "dimensions": {"width": w, "height": h, "channels": c},
            "file_size_kb": file_size_kb,
            "upload_timestamp": datetime.utcnow().isoformat(),
            "operations_applied": [],
            "last_operation": None,
            "is_generative_ai": False,
            "model_used": None,
            "processing_time_ms": 0.0,
            "metrics": None,
            "analysis": None
        }

        self.history.insert(0, record)
        self._save_history()
        return record

    def enhance_image(
        self,
        image_id: str,
        operation: str,
        params: Optional[Dict[str, Any]] = None,
        reference_image_bytes: Optional[bytes] = None
    ) -> Dict[str, Any]:
        """
        Executes chosen restoration technique, updates history record,
        and computes before/after metrics.
        """
        record = self.get_image_record(image_id)
        if not record:
            raise FileNotFoundError(f"Image ID {image_id} not found.")

        params = params or {}
        orig_path = record["original_path"]
        if not os.path.exists(orig_path):
            raise FileNotFoundError(f"Original image file missing from disk: {orig_path}")

        orig_img = cv2.imread(orig_path)
        if orig_img is None:
            raise ValueError("Failed to read original image.")

        # Optional Ground Truth Reference Image
        ref_gt_img = None
        if reference_image_bytes:
            nparr_ref = np.frombuffer(reference_image_bytes, np.uint8)
            ref_gt_img = cv2.imdecode(nparr_ref, cv2.IMREAD_COLOR)

        t_start = time.perf_counter()

        operation_lower = operation.lower().strip()
        enhanced_img = None
        model_desc = ""
        details = {}
        is_generative = False

        if operation_lower in ["denoise", "denoising"]:
            strength = float(params.get("strength", 1.0))
            method = str(params.get("method", "fast_nlm"))
            enhanced_img, model_desc, details = denoise_image(orig_img, strength=strength, method=method)

        elif operation_lower in ["deblur", "deblurring"]:
            strength = float(params.get("strength", 1.0))
            method = str(params.get("method", "richardson_lucy"))
            iterations = int(params.get("iterations", 15))
            enhanced_img, model_desc, details = deblur_image(orig_img, strength=strength, method=method, iterations=iterations)

        elif operation_lower in ["low_light", "lowlight", "low-light"]:
            boost = float(params.get("boost", 1.0))
            method = str(params.get("method", "zero_dce"))
            enhanced_img, model_desc, details = enhance_low_light(orig_img, boost=boost, method=method)

        elif operation_lower in ["contrast", "contrast_enhancement"]:
            clip_limit = float(params.get("clip_limit", 2.5))
            tile_size = int(params.get("tile_size", 8))
            method = str(params.get("method", "clahe_lab"))
            enhanced_img, model_desc, details = enhance_contrast(orig_img, clip_limit=clip_limit, tile_size=tile_size, method=method)

        elif operation_lower in ["super_resolution", "superres", "super_res", "esrgan"]:
            scale = int(params.get("scale", 4))
            use_neural = bool(params.get("use_neural", True))
            enhanced_img, model_desc, details = super_resolve_image(orig_img, scale=scale, use_neural=use_neural)

        elif operation_lower in ["diffusion", "generative_restoration", "generative_diffusion"]:
            strength = float(params.get("strength", 0.65))
            prompt = params.get("prompt", "")
            guidance = float(params.get("guidance_scale", 7.5))
            steps = int(params.get("steps", 12))
            is_generative = True
            enhanced_img, model_desc, details = restore_with_diffusion(
                orig_img,
                strength=strength,
                prompt=prompt,
                guidance_scale=guidance,
                steps=steps
            )

        else:
            raise ValueError(f"Unknown enhancement operation: '{operation}'. Valid: denoise, deblur, low_light, contrast, super_resolution, diffusion.")

        t_elapsed_ms = (time.perf_counter() - t_start) * 1000.0

        # Save enhanced image
        ext = os.path.splitext(orig_path)[1]
        enhanced_filename = f"enh_{image_id}_{operation_lower}{ext}"
        enhanced_path = os.path.join(self.output_dir, enhanced_filename)
        cv2.imwrite(enhanced_path, enhanced_img)

        # Calculate authentic quality metrics
        metrics = evaluate_image_metrics(
            enhanced_bgr=enhanced_img,
            original_bgr=orig_img,
            reference_gt_bgr=ref_gt_img,
            processing_time_ms=t_elapsed_ms
        )

        # Update record
        record["enhanced_url"] = f"/outputs/{enhanced_filename}"
        record["enhanced_path"] = enhanced_path
        record["last_operation"] = operation_lower
        record["is_generative_ai"] = is_generative
        record["model_used"] = model_desc
        record["operation_details"] = details
        record["processing_time_ms"] = round(t_elapsed_ms, 1)
        record["metrics"] = metrics
        record["operations_applied"].append({
            "operation": operation_lower,
            "timestamp": datetime.utcnow().isoformat(),
            "model": model_desc,
            "time_ms": round(t_elapsed_ms, 1),
            "is_generative": is_generative
        })

        self._save_history()
        return record

    def analyze_image(self, image_id: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Runs Vision-Language analysis on the specified image."""
        record = self.get_image_record(image_id)
        if not record:
            raise FileNotFoundError(f"Image ID {image_id} not found.")

        # Analyze enhanced image if available, else original
        target_path = record.get("enhanced_path") or record["original_path"]
        img = cv2.imread(target_path)
        if img is None:
            raise ValueError("Failed to load image for analysis.")

        analysis_result = analyze_inspection_image(img, user_context=context)
        record["analysis"] = analysis_result
        self._save_history()
        return analysis_result
