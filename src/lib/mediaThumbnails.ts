// ============================================
// TASKLYN — Client-side thumbnails for attachments
// Small JPEGs (≤ 360 px) generated before upload so task cards never
// have to download original photos or videos.
// ============================================

const THUMB_MAX_SIDE = 360;
const THUMB_QUALITY = 0.72;

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", THUMB_QUALITY));
}

function drawScaled(source: CanvasImageSource, w: number, h: number): HTMLCanvasElement | null {
  if (!w || !h) return null;
  const scale = Math.min(1, THUMB_MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function createImageThumbnail(file: Blob): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    const canvas = drawScaled(img, img.naturalWidth, img.naturalHeight);
    return canvas ? await canvasToJpeg(canvas) : null;
  } catch {
    return null; // e.g. HEIC on browsers that cannot decode it
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function createVideoThumbnail(file: Blob, timeoutMs = 8000): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.crossOrigin = "anonymous";
  try {
    const frame = await new Promise<HTMLCanvasElement | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      const done = (c: HTMLCanvasElement | null) => {
        clearTimeout(timer);
        resolve(c);
      };
      video.onloadedmetadata = () => {
        const t = Number.isFinite(video.duration) ? Math.min(1, video.duration * 0.1) : 0.1;
        video.currentTime = Math.max(0.05, t);
      };
      video.onseeked = () => done(drawScaled(video, video.videoWidth, video.videoHeight));
      video.onerror = () => done(null);
      video.src = url;
    });
    return frame ? await canvasToJpeg(frame) : null;
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

/** Thumbnail for images and videos; null for documents or on failure. */
export async function createThumbnail(file: File): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  if (file.type.startsWith("image/")) {
    if (file.type === "image/gif") return null; // keep animation; small anyway
    return createImageThumbnail(file);
  }
  if (file.type.startsWith("video/")) return createVideoThumbnail(file);
  return null;
}
