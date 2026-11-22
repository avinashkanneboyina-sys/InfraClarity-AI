# InfraClarity AI ⚡

**Industrial AI Inspection Image Restoration Platform for Energy & Utilities**

InfraClarity AI is an end-to-end computer vision and deep learning platform purpose-built for restoring, enhancing, and analyzing degraded visual inspection imagery from electrical transmission towers, power distribution grids, oil & gas midstream pipelines, and solar utility farms.

---

## 🌟 Key Features

- **6 Certified AI Restoration Operations:**
  1. **Image Denoising:** Fast Non-Local Means (Dual Luma/Chroma) and DnCNN 17-layer residual filtering to suppress dusk sensor noise and atmospheric haze.
  2. **AI Deblurring:** Richardson-Lucy PSF deconvolution and high-pass unsharp masking to counteract drone flight vibration and gimbal shake.
  3. **Low-Light Illumination:** Zero-DCE (Deep Curve Estimation) non-linear photometric dynamic range expansion for shaded casings and overcast captures.
  4. **Contrast Enhancement:** Adaptive Histogram Equalization (CLAHE on CIE L\*a\*b\* luminance space) to highlight bolt threads, weld seams, and surface corrosion without shifting hue.
  5. **Super-Resolution:** Real-ESRGAN (RRDBNet deep residual network) for 2× and 4× structural edge reconstruction of telephoto captures.
  6. **Generative Diffusion:** Stochastic UNet reverse diffusion synthesis for severe weather degradation with automatic **Hallucination Risk Scoring** and engineering disclaimers.
- **Interactive Dual-Mode Viewport:**
  - Split Before/After Slider with zoom, pan, and real-time scrubbing.
  - Side-by-Side comparative inspection mode.
- **Real-Time Image Clarity Metrics:**
  - Laplacian Focus Variance, RMS Luminance Contrast, Shannon Information Entropy (bits), Mean Luminance, and SNR (dB).
  - Authentic Full-Reference PSNR & SSIM evaluated when an optional Ground-Truth reference photo is attached.
- **Automated VLM Inspection Dossiers:**
  - Component analysis and markdown inspection dossier generation.
- **Processing History & Audit Logging:**
  - Chronological tracking with a single-click "Clear All History" feature (with confirmation dialog).

---

## 🛠️ Tech Stack

- **Backend:** Python 3.10+, FastAPI, PyTorch, torchvision, OpenCV (`cv2`), scikit-image, Pillow, NumPy, Hugging Face Transformers.
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React icons.
- **Architectures:** Real-ESRGAN (RRDBNet), Zero-DCE, DnCNN, Richardson-Lucy, Salesforce BLIP.

---

## 📂 Project Structure

```text
infraclarity-ai/
├── backend/
│   ├── main.py                     # FastAPI REST API server & endpoints
│   ├── image_processor.py          # Unified pipeline orchestration & history management
│   ├── enhancement.py              # Denoising, deblurring, low-light, & contrast algorithms
│   ├── super_resolution.py         # Real-ESRGAN RRDBNet inference engine
│   ├── diffusion_restoration.py    # Diffusion guidance & hallucination risk analysis
│   ├── image_analysis.py           # Visual-language inspection analysis (BLIP)
│   ├── metrics.py                  # Quantitative image quality assessment (Laplacian, RMS, SNR, PSNR/SSIM)
│   ├── download_models.py          # Model weights downloader for BLIP
│   ├── download_realesrgan.py      # Checkpoint downloader for Real-ESRGAN
│   ├── sample_images/              # 5 built-in utility inspection test captures
│   ├── requirements.txt            # Python dependencies
│   ├── uploads/                    # Staged inspection captures (gitignored)
│   └── outputs/                    # Restored images & audit logs (gitignored)
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components (BeforeAfterSlider, MetricCard, Navbar, etc.)
│   │   ├── pages/                  # Dashboard, EnhancementStudio, ImageAnalysis, ProcessingHistory
│   │   ├── services/api.js         # REST API client & response normalizer
│   │   ├── App.jsx                 # Application root & navigation
│   │   └── main.jsx                # React DOM entrypoint
│   ├── package.json                # Frontend dependencies & scripts
│   ├── tailwind.config.js          # Tailwind CSS styling configuration
│   └── vite.config.js              # Vite bundler configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10 or 3.11**
- **Node.js 18+ and npm**
- *(Optional)* NVIDIA GPU with CUDA support for accelerated neural inference.

---

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download Model Checkpoints:**
   ```bash
   python download_realesrgan.py
   python download_models.py
   ```
   *(Note: Model weights like RealESRGAN_x4plus (~64 MB) and BLIP (~944 MB) are excluded from Git repository tracking and fetched directly via these helper scripts).*

5. **Start the FastAPI backend server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend will be live at `http://localhost:8000` (API documentation at `http://localhost:8000/docs`).

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install node dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application UI will open at `http://localhost:5173`.

---

## 📖 Usage Guide

1. **Load or Upload an Inspection Capture:**
   - On the **Dashboard** or **Enhancement Studio**, click any of the 5 curated sample assets (e.g. *Transmission Tower*, *Pipeline Low-Light*, *Powerline Noise*) or drag & drop your own JPG/PNG inspection photo (up to 25 MB).
   - Optionally attach a clean ground-truth reference image if true PSNR/SSIM evaluation is desired.
2. **Select Enhancement Algorithm:**
   - Choose between Denoise, Deblur, Low-Light Illumination, Contrast, Real-ESRGAN Super-Resolution, or Generative Diffusion.
   - Adjust hyperparameter sliders (e.g. upscaling factor, deblur iterations, filter strength).
3. **Execute AI Restoration:**
   - Click **Run AI Restoration**.
   - Compare results using the Split Slider or Side-by-Side comparison view.
   - Review quantitative Laplacian sharpness, RMS contrast, and SNR metrics.
4. **Audit and Export:**
   - Download the restored image or download the generated Markdown inspection report.
   - View previous runs in the **Processing History** tab or clear logs with **Clear All History**.

---

## 📄 License

This project is licensed under the Apache 2.0 License.
