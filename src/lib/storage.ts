// ============================================
// TASKLYN — Firebase Storage Helpers
// Real Storage upload/delete with deterministic
// paths and a safe fallback for legacy data URLs.
// ============================================

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";
import { nanoid } from "nanoid";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

// Firestore documents have a ~1 MiB limit; keep data URLs well below it.
const MAX_DATA_URL_LENGTH = 750_000;

export interface UploadResult {
  url: string;
  storagePath?: string;
}

// --- Validation ----------------------------------------------------------

export interface ImageValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

/**
 * Validate and prepare image file for upload.
 * Checks MIME type and file size. Returns the file unchanged if valid.
 */
export async function prepareImageFile(
  file: File,
  options: ImageValidationOptions = {},
): Promise<File> {
  const { maxSizeBytes = 10 * 1024 * 1024, allowedTypes = ALLOWED_TYPES } =
    options;

  if (!file.type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen");
  }

  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error(
      `Formato no soportado. Usa: ${allowedTypes
        .map((t) => t.replace("image/", ""))
        .join(", ")}`,
    );
  }

  if (file.size === 0) {
    throw new Error("El archivo está vacío");
  }

  if (file.size > maxSizeBytes) {
    throw new Error(
      `La imagen es demasiado grande. Máximo ${(maxSizeBytes / 1024 / 1024).toFixed(0)} MB.`,
    );
  }

  return file;
}

function fileExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_EXTENSIONS.includes(`.${ext}`) ? ext : "jpg";
}

function safeFileName(file: File): string {
  const base = file.name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .replace(/\.[^/.]+$/, "");
  const id = nanoid(10);
  return `${base || "img"}_${id}.${fileExtension(file.name)}`;
}

// --- Compression ---------------------------------------------------------

export function dataURLToFile(dataURL: string, fileName: string): File {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Compress an image to a JPEG Blob with a max longest side.
 * Returns a Blob, not a data URL, ready for Firebase Storage upload.
 */
export async function compressImageToBlob(
  file: File | Blob,
  maxSide = 1400,
  quality = 0.85,
): Promise<Blob> {
  const blob = file instanceof File ? file : new File([file], "img.jpg");
  if (!blob.type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen");
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo leer la imagen"));
      el.src = objectUrl;
    });

    const scale = Math.min(
      1,
      maxSide / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la imagen");
    ctx.drawImage(img, 0, 0, w, h);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) {
            reject(new Error("No se pudo comprimir la imagen"));
            return;
          }
          resolve(b);
        },
        "image/jpeg",
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Compress an image file into a JPEG data URL that fits inside a
 * Firestore document. Used only as a fallback when Firebase Storage
 * is unavailable (e.g. billing/plan not enabled).
 */
export async function fileToCompressedDataUrl(
  file: File | Blob,
  initialMaxSide = 1400,
  maxLength = MAX_DATA_URL_LENGTH,
): Promise<string> {
  const blob = file instanceof File ? file : new File([file], "img.jpg");
  if (!blob.type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen");
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo leer la imagen"));
      el.src = objectUrl;
    });

    let maxSide = initialMaxSide;
    let quality = 0.72;

    for (let attempt = 0; attempt < 5; attempt++) {
      const scale = Math.min(
        1,
        maxSide / Math.max(img.naturalWidth, img.naturalHeight),
      );
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo procesar la imagen");
      ctx.drawImage(img, 0, 0, w, h);

      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= maxLength) return dataUrl;

      maxSide = Math.round(maxSide * 0.7);
      quality = Math.max(0.4, quality - 0.12);
    }

    throw new Error(
      "La imagen es demasiado pesada. Prueba con una más ligera.",
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// --- Core upload ---------------------------------------------------------

async function uploadToStorage(
  path: string,
  blob: Blob,
  contentType = "image/jpeg",
): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}

// --- Profile photos ------------------------------------------------------

export async function uploadProfilePhoto(
  userId: string,
  file: File | Blob | Uint8Array,
  _fileName?: string,
): Promise<string> {
  const blob =
    file instanceof Uint8Array
      ? new Blob([file as unknown as BlobPart], { type: "image/jpeg" })
      : file;

  // Try Firebase Storage first. If the bucket is unavailable (e.g. 402
  // payment/billing) or any other error occurs, fall back to a compressed
  // data URL stored directly in Firestore so the app keeps working.
  try {
    const compressed = await compressImageToBlob(blob, 512, 0.88);
    const path = `users/${userId}/profile/avatar.jpg`;
    return await uploadToStorage(path, compressed, "image/jpeg");
  } catch (error) {
    console.warn(
      "[uploadProfilePhoto] Storage upload failed, falling back to data URL:",
      error,
    );
    return fileToCompressedDataUrl(blob, 512, MAX_DATA_URL_LENGTH);
  }
}

export async function deleteProfilePhoto(userId: string): Promise<void> {
  const storageRef = ref(storage, `users/${userId}/profile/avatar.jpg`);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    // Object not found is OK — already deleted or was a data URL.
    console.warn("Failed to delete profile photo:", error);
  }
}

// --- Team photos ---------------------------------------------------------

export async function uploadTeamPhoto(
  teamId: string,
  file: File | Blob | Uint8Array,
): Promise<string> {
  const blob =
    file instanceof Uint8Array
      ? new Blob([file as unknown as BlobPart], { type: "image/jpeg" })
      : file;

  // Try Firebase Storage first, fall back to a compressed data URL if it fails.
  try {
    const compressed = await compressImageToBlob(blob, 800, 0.88);
    const path = `teams/${teamId}/photo/team-photo.jpg`;
    return await uploadToStorage(path, compressed, "image/jpeg");
  } catch (error) {
    console.warn(
      "[uploadTeamPhoto] Storage upload failed, falling back to data URL:",
      error,
    );
    return fileToCompressedDataUrl(blob, 800, MAX_DATA_URL_LENGTH);
  }
}

export async function deleteTeamPhoto(teamId: string): Promise<void> {
  const storageRef = ref(storage, `teams/${teamId}/photo/team-photo.jpg`);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Failed to delete team photo:", error);
  }
}

// --- Background / list image library -------------------------------------

export async function uploadBackgroundImage(
  userId: string,
  file: File | Blob,
  _category?: string,
): Promise<UploadResult> {
  // Backgrounds can be larger but still need a sane cap.
  // Try Firebase Storage first, fall back to a compressed data URL if it fails.
  try {
    const compressed = await compressImageToBlob(file, 1920, 0.85);
    const fileName = safeFileName(
      file instanceof File ? file : new File([file], "background.jpg"),
    );
    const storagePath = `backgrounds/${userId}/${fileName}`;
    const url = await uploadToStorage(storagePath, compressed, "image/jpeg");
    return { url, storagePath };
  } catch (error) {
    console.warn(
      "[uploadBackgroundImage] Storage upload failed, falling back to data URL:",
      error,
    );
    const dataUrl = await fileToCompressedDataUrl(
      file,
      1400,
      MAX_DATA_URL_LENGTH,
    );
    return { url: dataUrl, storagePath: undefined };
  }
}

export async function deleteBackgroundImage(
  storagePath: string,
): Promise<void> {
  if (!storagePath || storagePath.startsWith("data:")) return;
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Failed to delete background image from Storage:", error);
  }
}
