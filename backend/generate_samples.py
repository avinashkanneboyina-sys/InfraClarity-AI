"""
Script to generate realistic sample energy and utility inspection images
with simulated optical degradation (blur, noise, low light, low contrast).
"""

import os
import math
import numpy as np
import cv2

SAMPLE_DIR = r"C:\Users\avina\.gemini\antigravity\scratch\infraclarity-ai\backend\sample_images"
os.makedirs(SAMPLE_DIR, exist_ok=True)

def create_transmission_tower():
    """Generates an electrical lattice transmission tower with motion blur."""
    w, h = 900, 1100
    # Gradient sky background (evening sunset glow)
    img = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        r = int(140 + 70 * (y / h))
        g = int(170 + 40 * (y / h))
        b = int(210 - 50 * (y / h))
        img[y, :] = (b, g, r)

    # Draw transmission tower lattice
    tower_color = (65, 70, 75)
    cx = w // 2
    top_y = 150
    base_y = 1000
    top_w = 40
    base_w = 260

    # Main legs
    p1 = (cx - top_w, top_y)
    p2 = (cx + top_w, top_y)
    p3 = (cx + base_w, base_y)
    p4 = (cx - base_w, base_y)
    cv2.line(img, p1, p4, tower_color, 8)
    cv2.line(img, p2, p3, tower_color, 8)

    # Cross braces
    steps = 14
    for i in range(steps):
        t1 = i / steps
        t2 = (i + 1) / steps
        y1 = int(top_y + (base_y - top_y) * t1)
        y2 = int(top_y + (base_y - top_y) * t2)
        w1 = int(top_w + (base_w - top_w) * t1)
        w2 = int(top_w + (base_w - top_w) * t2)

        # Horizontal strut
        cv2.line(img, (cx - w1, y1), (cx + w1, y1), tower_color, 4)
        # X-bracing
        cv2.line(img, (cx - w1, y1), (cx + w2, y2), tower_color, 3)
        cv2.line(img, (cx + w1, y1), (cx - w2, y2), tower_color, 3)

    # Crossarms
    arms = [(320, 380), (480, 440), (640, 360)]
    for arm_y, arm_w in arms:
        cv2.line(img, (cx - arm_w, arm_y), (cx + arm_w, arm_y), tower_color, 9)
        cv2.line(img, (cx - arm_w, arm_y), (cx, arm_y - 70), tower_color, 4)
        cv2.line(img, (cx + arm_w, arm_y), (cx, arm_y - 70), tower_color, 4)

        # Insulator strings hanging from crossarm tips
        for sign in [-1, 1]:
            ix = cx + sign * (arm_w - 20)
            # Bell discs
            for d in range(8):
                dy = arm_y + 15 + d * 14
                cv2.ellipse(img, (ix, dy), (12, 6), 0, 0, 360, (140, 150, 160), -1)
                cv2.ellipse(img, (ix, dy), (12, 6), 0, 0, 360, (50, 50, 50), 1)

            # Conductor line passing through clamp
            clamp_y = arm_y + 15 + 8 * 14
            cv2.line(img, (0, clamp_y - 20), (w, clamp_y + 30), (45, 50, 55), 3)

    # Apply realistic drone camera motion blur (horizontal & diagonal smear)
    kernel_size = 19
    kernel = np.zeros((kernel_size, kernel_size))
    center = kernel_size // 2
    for k in range(kernel_size):
        kernel[k, min(kernel_size-1, int(k * 0.8))] = 1.0
    kernel /= kernel.sum()
    blurred = cv2.filter2D(img, -1, kernel)

    # Add slight atmospheric noise
    noise = np.random.normal(0, 7, blurred.shape).astype(np.float32)
    degraded = np.clip(blurred.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    out_path = os.path.join(SAMPLE_DIR, "transmission_tower_blur.jpg")
    cv2.imwrite(out_path, degraded)
    print("Created:", out_path)


def create_pipeline_lowlight():
    """Generates an industrial oil/gas pipeline with shadows and underexposure."""
    w, h = 1000, 750
    img = np.zeros((h, w, 3), dtype=np.uint8)

    # Shaded industrial concrete/gravel floor
    for y in range(h):
        shade = int(25 + 15 * (y / h))
        img[y, :] = (shade, shade + 2, shade + 5)

    # Main horizontal pipeline
    pipe_y = 380
    pipe_radius = 120

    # Pipe cylinder 3D gradient
    for y in range(pipe_y - pipe_radius, pipe_y + pipe_radius):
        rel = (y - pipe_y) / pipe_radius
        intensity = math.cos(rel * (math.pi / 2.2))
        # Deep shadowed underbelly
        if rel > 0.3:
            intensity *= 0.35
        b = int(35 * intensity)
        g = int(45 * intensity)
        r = int(55 * intensity)
        img[y, 100:900] = (b, g, r)

    # Weld flange ring
    flange_x = 520
    cv2.rectangle(img, (flange_x - 15, pipe_y - pipe_radius - 20), (flange_x + 15, pipe_y + pipe_radius + 20), (40, 50, 60), -1)
    # Stud bolts on flange
    for angle in range(0, 360, 30):
        rad = math.radians(angle)
        bx = int(flange_x + math.sin(rad) * 4)
        by = int(pipe_y + math.cos(rad) * (pipe_radius + 10))
        cv2.circle(img, (bx, by), 5, (70, 75, 80), -1)

    # Valve handwheel on top
    cv2.line(img, (flange_x, pipe_y - pipe_radius - 20), (flange_x, pipe_y - pipe_radius - 90), (50, 55, 60), 12)
    cv2.ellipse(img, (flange_x, pipe_y - pipe_radius - 90), (60, 20), 0, 0, 360, (30, 30, 80), 8)

    # Concrete support saddles
    for sx in [220, 780]:
        cv2.rectangle(img, (sx - 35, pipe_y + 40), (sx + 35, h - 80), (35, 38, 42), -1)

    # Simulate severe underexposure (dusk / confined trench inspection)
    dark_img = (img.astype(np.float32) * 0.45).astype(np.uint8)
    
    # Add sensor noise characteristic of low light
    noise = np.random.normal(0, 8, dark_img.shape).astype(np.float32)
    degraded = np.clip(dark_img.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    out_path = os.path.join(SAMPLE_DIR, "pipeline_lowlight.jpg")
    cv2.imwrite(out_path, degraded)
    print("Created:", out_path)


def create_powerline_noise():
    """Generates overhead high-voltage transmission lines with high-ISO sensor noise."""
    w, h = 960, 720
    # Twilight sky with gradient
    img = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        r = int(90 - 40 * (y / h))
        g = int(120 - 50 * (y / h))
        b = int(160 - 60 * (y / h))
        img[y, :] = (b, g, r)

    # Draw 4 high-voltage conductors with catenary curves
    conductors = [
        (180, 260, 210, 4),
        (260, 350, 290, 4),
        (380, 480, 420, 5),
        (470, 570, 500, 5)
    ]
    for y_left, y_mid, y_right, thick in conductors:
        # Catenary points
        pts = []
        for x in range(0, w, 20):
            # Parabolic sag
            norm_x = (x - w/2) / (w/2)
            y = int(y_mid - (y_mid - (y_left + y_right)/2) * (1 - norm_x**2) + ((y_right - y_left)/2) * norm_x)
            pts.append((x, y))
        for p in range(len(pts) - 1):
            cv2.line(img, pts[p], pts[p+1], (30, 32, 35), thick)

    # Distant lattice tower silhouette on right
    tx = int(w * 0.85)
    cv2.line(img, (tx - 40, h), (tx - 10, 180), (35, 38, 42), 6)
    cv2.line(img, (tx + 40, h), (tx + 10, 180), (35, 38, 42), 6)
    for y in range(220, h, 60):
        cv2.line(img, (tx - 35, y), (tx + 35, y), (35, 38, 42), 3)

    # Add heavy Gaussian + salt & pepper noise
    noise_gaussian = np.random.normal(0, 22, img.shape).astype(np.float32)
    degraded = np.clip(img.astype(np.float32) + noise_gaussian, 0, 255).astype(np.uint8)

    # Salt & Pepper specks
    num_sp = int(w * h * 0.008)
    for _ in range(num_sp):
        rx, ry = np.random.randint(0, w), np.random.randint(0, h)
        val = 255 if np.random.rand() > 0.5 else 0
        degraded[ry, rx] = (val, val, val)

    out_path = os.path.join(SAMPLE_DIR, "powerline_noise.jpg")
    cv2.imwrite(out_path, degraded)
    print("Created:", out_path)


def create_substation_lowcontrast():
    """Generates utility substation equipment under low contrast overcast fog."""
    w, h = 900, 700
    img = np.zeros((h, w, 3), dtype=np.uint8)

    # Overcast gray haze
    img[:] = (180, 182, 185)

    # Transformer base tank
    cv2.rectangle(img, (200, 320), (700, 620), (130, 135, 140), -1)
    # Radiator cooling fins
    for fx in range(220, 680, 24):
        cv2.line(img, (fx, 340), (fx, 600), (105, 110, 115), 5)

    # Top high-voltage bushings (ceramic bells)
    bushings_x = [300, 450, 600]
    for bx in bushings_x:
        # Bushing stalk
        cv2.line(img, (bx, 320), (bx, 150), (120, 125, 130), 14)
        for by in range(180, 310, 18):
            cv2.ellipse(img, (bx, by), (22, 8), 0, 0, 360, (90, 95, 100), -1)
        # Terminal cap
        cv2.circle(img, (bx, 140), 12, (150, 155, 160), -1)
        # Overhead drop lead
        cv2.line(img, (bx, 140), (bx - 80, 40), (110, 115, 120), 4)

    # Flatten dynamic range to simulate thick fog / washed-out overcast condition
    # Map [0, 255] into narrow interval [130, 190]
    gray_flat = 150 + (img.astype(np.float32) - 150) * 0.35
    degraded = np.clip(gray_flat, 0, 255).astype(np.uint8)

    out_path = os.path.join(SAMPLE_DIR, "substation_lowcontrast.jpg")
    cv2.imwrite(out_path, degraded)
    print("Created:", out_path)


def create_solar_array_lowres():
    """Generates solar farm panels with sub-Nyquist low resolution."""
    w, h = 500, 380  # Low res
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:] = (120, 150, 170)

    # Ground grass
    cv2.rectangle(img, (0, 240), (w, h), (60, 90, 70), -1)

    # Rows of PV panels
    for row in range(3):
        base_y = 120 + row * 60
        for col in range(6):
            px = 40 + col * 75
            py = base_y
            pw = 65
            ph = 45
            # Aluminum frame
            cv2.rectangle(img, (px, py), (px + pw, py + ph), (180, 185, 190), 2)
            # Silicon cell blue
            cv2.rectangle(img, (px + 2, py + 2), (px + pw - 2, py + ph - 2), (110, 60, 20), -1)
            # Grid busbars
            cv2.line(img, (px + 22, py + 2), (px + 22, py + ph - 2), (160, 165, 170), 1)
            cv2.line(img, (px + 44, py + 2), (px + 44, py + ph - 2), (160, 165, 170), 1)

    out_path = os.path.join(SAMPLE_DIR, "solar_array_lowres.jpg")
    cv2.imwrite(out_path, img)
    print("Created:", out_path)


if __name__ == "__main__":
    create_transmission_tower()
    create_pipeline_lowlight()
    create_powerline_noise()
    create_substation_lowcontrast()
    create_solar_array_lowres()
    print("All sample infrastructure images generated successfully!")
