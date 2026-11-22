/**
 * InfraClarity AI - REST API Client
 */

const API_BASE = "http://localhost:8000";

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch (err) {
    console.error("Backend health fetch error:", err);
    return null;
  }
}

export async function fetchSamples() {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) throw new Error("Failed to load sample images");
  return await res.json();
}

export async function loadSample(sampleId) {
  const res = await fetch(`${API_BASE}/load-sample/${sampleId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to load sample ${sampleId}`);
  const raw = await res.json();
  return normalizeUploadResponse(raw);
}

// Helper to normalize any upload response into the shape the UI expects
function normalizeUploadResponse(raw) {
  // The API response may be wrapped in a top‑level `record` object or have fields nested under `image`.
  const data = raw.record ?? raw.image ?? raw;
  // Image identifier – try several common keys.
  const imageId = data.image_id ?? data.id ?? data.imageId ?? data._id ?? data.uid;
  // Original URL – backend returns 'upload_url': '/uploads/orig_<uuid>.jpg'
  const originalUrl =
    data.original_url ??
    data.upload_url ??
    data.originalUrl ??
    data.original ??
    data.url ?? // plain 'url' field
    (data.urls && (data.urls.original || data.urls.upload)) ??
    (data.original && data.original.url) ??
    (data.image && (data.image.original_url || data.image.upload_url)) ??
    "";
  // Enhanced URL – backend returns 'enhanced_url'
  const enhancedUrl =
    data.enhanced_url ??
    data.enhancedUrl ??
    data.enhanced ??
    (data.urls && data.urls.enhanced) ??
    (data.enhanced && data.enhanced.url) ??
    (data.image && data.image.enhanced_url) ??
    "";
  // Dimensions – backend returns dimensions: { width: w, height: h, channels: c }
  const dimensions =
    data.dimensions ??
    data.size ??
    (data.original_width != null && data.original_height != null
      ? { width: data.original_width, height: data.original_height }
      : undefined) ??
    (data.original && data.original.width && data.original.height
      ? { width: data.original.width, height: data.original.height }
      : undefined);
  // Return a new object preserving any other fields returned by the backend.
  return {
    ...raw,
    ...data,
    image_id: imageId,
    original_url: originalUrl,
    enhanced_url: enhancedUrl,
    dimensions,
  };
}

export async function uploadImage(file, referenceFile = null) {
  const formData = new FormData();
  formData.append("file", file);
  if (referenceFile) {
    formData.append("reference", referenceFile);
  }

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Image upload failed");
  }

  const raw = await res.json();
  console.log("[api.uploadImage] raw response:", raw);
  const normalized = normalizeUploadResponse(raw);
  console.log("[api.uploadImage] normalized record:", normalized);
  return normalized;
}

export async function enhanceImage(imageId, operation, params = {}, referenceFile = null) {
  const formData = new FormData();
  formData.append("image_id", imageId);
  formData.append("operation", operation);
  formData.append("params", JSON.stringify(params));
  if (referenceFile) {
    formData.append("reference_file", referenceFile);
  }

  const res = await fetch(`${API_BASE}/enhance`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Enhancement failed" }));
    throw new Error(err.detail || "Enhancement processing failed");
  }
  const raw = await res.json();
  return normalizeUploadResponse(raw);
}

export async function analyzeImage(imageId, context = "") {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_id: imageId, context }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || "VLM image analysis failed");
  }
  return await res.json();
}

export async function compareImages(imageId) {
  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_id: imageId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Comparison failed" }));
    throw new Error(err.detail || "Failed to retrieve comparison");
  }
  return await res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error("Failed to load processing history");
  return await res.json();
}

export async function clearHistory() {
  const res = await fetch(`${API_BASE}/history`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to clear history" }));
    throw new Error(err.detail || "Failed to clear history");
  }
  return await res.json();
}

export function getDownloadUrl(imageId) {
  return `${API_BASE}/download/${imageId}`;
}

export function getReportUrl(imageId) {
  return `${API_BASE}/report/${imageId}`;
}

export function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  // Ensure exactly one leading slash between base and path
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}
