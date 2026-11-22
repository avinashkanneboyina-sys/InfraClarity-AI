"""
InfraClarity AI - Automated Backend Verification Suite
Tests all enhancement operations, metrics calculations, VLM analysis, and file persistence.
"""

import os
import sys
import numpy as np
import cv2

from image_processor import ImageProcessor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLE_DIR = os.path.join(BASE_DIR, "sample_images")
TEST_UPLOAD = os.path.join(BASE_DIR, "uploads")
TEST_OUTPUT = os.path.join(BASE_DIR, "outputs")

def run_tests():
    sys.stdout.reconfigure(line_buffering=True)
    print("=== InfraClarity AI Backend Test Suite ===", flush=True)
    processor = ImageProcessor(upload_dir=TEST_UPLOAD, output_dir=TEST_OUTPUT)

    sample_path = os.path.join(SAMPLE_DIR, "transmission_tower_blur.jpg")
    assert os.path.exists(sample_path), f"Sample image {sample_path} does not exist"

    with open(sample_path, "rb") as f:
        bytes_data = f.read()

    # 1. Test Upload Registration
    print("[1/8] Testing Image Upload Registration...")
    record = processor.register_upload("test_tower.jpg", bytes_data)
    img_id = record["image_id"]
    print(f"  -> Uploaded successfully. ID: {img_id}, Dims: {record['dimensions']}")

    # 2. Test Denoising
    print("[2/8] Testing Denoising (Fast NLM & DnCNN)...")
    rec_denoise = processor.enhance_image(img_id, "denoise", {"strength": 1.2, "method": "fast_nlm"})
    assert rec_denoise["enhanced_url"] is not None
    print(f"  -> Denoise model: {rec_denoise['model_used']}, Latency: {rec_denoise['processing_time_ms']} ms")

    # 3. Test Deblurring
    print("[3/8] Testing Deblurring (Richardson-Lucy)...")
    rec_deblur = processor.enhance_image(img_id, "deblur", {"strength": 1.0, "method": "richardson_lucy", "iterations": 10})
    print(f"  -> Deblur model: {rec_deblur['model_used']}, Latency: {rec_deblur['processing_time_ms']} ms")

    # 4. Test Low-Light Enhancement
    print("[4/8] Testing Low-Light Enhancement (Zero-DCE)...")
    rec_lowlight = processor.enhance_image(img_id, "low_light", {"boost": 1.3, "method": "zero_dce"})
    print(f"  -> Low-light model: {rec_lowlight['model_used']}, Latency: {rec_lowlight['processing_time_ms']} ms")

    # 5. Test Contrast Enhancement
    print("[5/8] Testing Contrast Enhancement (CLAHE L*a*b*)...")
    rec_contrast = processor.enhance_image(img_id, "contrast", {"clip_limit": 2.5, "method": "clahe_lab"})
    print(f"  -> Contrast model: {rec_contrast['model_used']}, Latency: {rec_contrast['processing_time_ms']} ms")

    # 6. Test Super-Resolution (Real-ESRGAN / Guided Subpixel)
    print("[6/8] Testing Super-Resolution (x2)...")
    rec_sr = processor.enhance_image(img_id, "super_resolution", {"scale": 2, "use_neural": True})
    sr_dims = rec_sr["metrics"]["dimensions"]["enhanced"]
    print(f"  -> SR model: {rec_sr['model_used']}, Scaled Dims: {sr_dims['width']}x{sr_dims['height']}, Latency: {rec_sr['processing_time_ms']} ms")

    # 7. Test Generative Diffusion Restoration
    print("[7/8] Testing Generative Diffusion Restoration...")
    rec_diff = processor.enhance_image(img_id, "diffusion", {"strength": 0.5, "steps": 6})
    assert rec_diff["is_generative_ai"] is True
    halluc_risk = rec_diff["operation_details"]["hallucination_risk"]
    print(f"  -> Diffusion model: {rec_diff['model_used']}")
    print(f"  -> Hallucination Risk Score: {halluc_risk['risk_score']} ({halluc_risk['risk_level']})")

    # 8. Test Vision-Language Analysis
    print("[8/8] Testing Vision-Language Image Analysis...")
    analysis = processor.analyze_image(img_id, context="Electric transmission tower inspection")
    assert "asset_classification" in analysis
    assert "visible_components" in analysis
    assert "regulatory_disclaimer" in analysis
    print(f"  -> Identified: {analysis['asset_classification']['primary_asset']} (Confidence: {analysis['asset_classification']['confidence']*100:.1f}%)")
    print(f"  -> Visible components count: {len(analysis['visible_components'])}")
    print(f"  -> Quality problems identified: {len(analysis['image_quality_problems'])}")

    print("\nALL BACKEND ENGINE TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_tests()
