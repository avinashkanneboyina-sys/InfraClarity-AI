"""
InfraClarity AI - Image Quality Metrics Module
Provides mathematically rigorous full-reference (when ground-truth available)
and no-reference image quality assessment metrics.

CRITICAL INTEGRITY PRINCIPLE:
PSNR and SSIM are ONLY computed when a true ground-truth reference image is provided.
The degraded input is NEVER treated as ground truth to fabricate misleading scores.
"""

import time
import math
import numpy as np
import cv2
from typing import Optional, Dict, Any

try:
    from skimage.metrics import peak_signal_noise_ratio as skimage_psnr
    from skimage.metrics import structural_similarity as skimage_ssim
    SKIMAGE_AVAILABLE = True
except ImportError:
    SKIMAGE_AVAILABLE = False


def compute_laplacian_sharpness(img_bgr: np.ndarray) -> float:
    """Computes focus/sharpness measure via variance of the Laplacian."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    score = float(laplacian.var())
    return round(score, 2)


def compute_tenengrad_sharpness(img_bgr: np.ndarray) -> float:
    """Computes Tenengrad gradient energy sharpness score."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag_sq = gx ** 2 + gy ** 2
    return round(float(np.mean(grad_mag_sq)), 2)


def compute_rms_contrast(img_bgr: np.ndarray) -> float:
    """Computes root-mean-square (RMS) luminance contrast."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float64) / 255.0
    rms = np.std(gray)
    return round(float(rms * 100.0), 2)  # expressed as percentage


def compute_image_entropy(img_bgr: np.ndarray) -> float:
    """Computes Shannon entropy (information content in bits per pixel)."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
    hist = hist.ravel() / (hist.sum() + 1e-7)
    non_zeros = hist[hist > 0]
    entropy = -np.sum(non_zeros * np.log2(non_zeros))
    return round(float(entropy), 3)


def estimate_immerkaer_noise(img_bgr: np.ndarray) -> float:
    """
    Fast noise-variance estimation using Immerkaer's Laplacian operator.
    Does not assume prior knowledge of the image structure.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float64)
    h, w = gray.shape
    if h < 3 or w < 3:
        return 0.0

    # 3x3 noise mask
    kernel = np.array([
        [1, -2,  1],
        [-2, 4, -2],
        [1, -2,  1]
    ], dtype=np.float64)

    filtered = cv2.filter2D(gray, -1, kernel)
    # Trim borders affected by filter
    interior = filtered[1:-1, 1:-1]
    sigma = np.sum(np.abs(interior)) * np.sqrt(0.5 * np.pi) / (6.0 * (w - 2) * (h - 2))
    return round(float(sigma), 3)


def compute_brisque_like_nss(img_bgr: np.ndarray) -> float:
    """
    Approximates Natural Scene Statistics (NSS) score based on Mean Subtracted
    Contrast Normalized (MSCN) coefficients.
    Lower score indicates cleaner, more naturalistic statistical distribution.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float64)
    mu = cv2.GaussianBlur(gray, (7, 7), 7/6)
    mu_sq = mu * mu
    sigma = cv2.GaussianBlur(gray * gray, (7, 7), 7/6)
    sigma = np.sqrt(np.abs(sigma - mu_sq) + 1.0)
    structdis = (gray - mu) / sigma
    
    # Statistical deviations from unit normal distribution
    sample_var = np.var(structdis)
    skewness = np.mean(((structdis - np.mean(structdis)) / (np.std(structdis) + 1e-6)) ** 3)
    kurtosis = np.mean(((structdis - np.mean(structdis)) / (np.std(structdis) + 1e-6)) ** 4)
    
    # Combined NSS distortion indicator (calibrated roughly 0-100)
    nss_distortion = abs(sample_var - 1.0) * 15.0 + abs(skewness) * 10.0 + abs(kurtosis - 3.0) * 5.0
    return round(float(min(100.0, max(0.0, nss_distortion))), 2)


def evaluate_image_metrics(
    enhanced_bgr: np.ndarray,
    original_bgr: np.ndarray,
    reference_gt_bgr: Optional[np.ndarray] = None,
    processing_time_ms: float = 0.0
) -> Dict[str, Any]:
    """
    Comprehensive evaluation of enhanced image against original degraded image
    and optional ground-truth reference image.
    """
    h_enh, w_enh, c_enh = enhanced_bgr.shape
    h_orig, w_orig, c_orig = original_bgr.shape

    # No-Reference metrics for Enhanced image
    enh_sharpness = compute_laplacian_sharpness(enhanced_bgr)
    enh_tenengrad = compute_tenengrad_sharpness(enhanced_bgr)
    enh_contrast = compute_rms_contrast(enhanced_bgr)
    enh_entropy = compute_image_entropy(enhanced_bgr)
    enh_noise = estimate_immerkaer_noise(enhanced_bgr)
    enh_nss = compute_brisque_like_nss(enhanced_bgr)

    # No-Reference metrics for Original degraded image
    orig_sharpness = compute_laplacian_sharpness(original_bgr)
    orig_tenengrad = compute_tenengrad_sharpness(original_bgr)
    orig_contrast = compute_rms_contrast(original_bgr)
    orig_entropy = compute_image_entropy(original_bgr)
    orig_noise = estimate_immerkaer_noise(original_bgr)
    orig_nss = compute_brisque_like_nss(original_bgr)

    # Relative improvements (%)
    def calc_pct_change(orig_val, enh_val):
        if orig_val <= 1e-6:
            return 0.0
        return round(((enh_val - orig_val) / orig_val) * 100.0, 1)

    sharpness_gain_pct = calc_pct_change(orig_sharpness, enh_sharpness)
    contrast_change_pct = calc_pct_change(orig_contrast, enh_contrast)
    entropy_gain_pct = calc_pct_change(orig_entropy, enh_entropy)
    
    # Noise reduction percentage (positive means noise dropped)
    noise_reduction_pct = 0.0
    if orig_noise > 1e-4:
        noise_reduction_pct = round(((orig_noise - enh_noise) / orig_noise) * 100.0, 1)

    # Full-Reference (FR) Metrics: ONLY if reference_gt_bgr is provided
    fr_metrics = {
        "reference_available": False,
        "psnr": None,
        "ssim": None,
        "explanation": "PSNR and SSIM require a certified ground-truth reference image. The degraded inspection input is NOT ground truth. Displaying certified No-Reference Quality Assessment (NR-IQA) metrics instead."
    }

    if reference_gt_bgr is not None and SKIMAGE_AVAILABLE:
        # Match dimensions if needed for mathematical comparison
        gt = reference_gt_bgr
        if gt.shape != enhanced_bgr.shape:
            gt = cv2.resize(gt, (w_enh, h_enh), interpolation=cv2.INTER_CUBIC)
        
        try:
            psnr_val = float(skimage_psnr(gt, enhanced_bgr, data_range=255))
            ssim_val = float(skimage_ssim(gt, enhanced_bgr, channel_axis=2, data_range=255))
            fr_metrics = {
                "reference_available": True,
                "psnr": round(psnr_val, 2),
                "ssim": round(ssim_val, 4),
                "explanation": "Calculated against verified Ground Truth reference image."
            }
        except Exception as e:
            fr_metrics["calculation_error"] = str(e)

    return {
        "dimensions": {
            "original": {"width": w_orig, "height": h_orig, "channels": c_orig},
            "enhanced": {"width": w_enh, "height": h_enh, "channels": c_enh},
            "scale_factor": round(w_enh / max(w_orig, 1), 2)
        },
        "processing_time_ms": round(processing_time_ms, 1),
        "no_reference_metrics": {
            "enhanced": {
                "sharpness_laplacian": enh_sharpness,
                "sharpness_tenengrad": enh_tenengrad,
                "rms_contrast_pct": enh_contrast,
                "shannon_entropy_bits": enh_entropy,
                "estimated_noise_sigma": enh_noise,
                "nss_distortion_score": enh_nss
            },
            "original": {
                "sharpness_laplacian": orig_sharpness,
                "sharpness_tenengrad": orig_tenengrad,
                "rms_contrast_pct": orig_contrast,
                "shannon_entropy_bits": orig_entropy,
                "estimated_noise_sigma": orig_noise,
                "nss_distortion_score": orig_nss
            },
            "relative_change": {
                "sharpness_gain_pct": sharpness_gain_pct,
                "contrast_change_pct": contrast_change_pct,
                "noise_reduction_pct": noise_reduction_pct,
                "entropy_gain_pct": entropy_gain_pct
            }
        },
        "full_reference_metrics": fr_metrics
    }
