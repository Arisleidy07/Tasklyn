// ============================================
// TASKLYN — Firebase Storage Helpers
// Profile photo uploads with mobile/desktop support
// ============================================

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

const PROFILE_PHOTOS_PATH = "profile-photos";
const TEAM_PHOTOS_PATH = "team-photos";

/**
 * Upload a profile photo to Firebase Storage
 * Supports file, blob, or Uint8Array
 * Returns the public download URL
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File | Blob | Uint8Array,
  fileName?: string,
): Promise<string> {
  const storageRef = ref(
    storage,
    `${PROFILE_PHOTOS_PATH}/${userId}/${fileName || `photo-${Date.now()}`}`,
  );

  await uploadBytes(storageRef, file, {
    contentType: file instanceof File ? file.type : "image/jpeg",
  });

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Delete a profile photo from Firebase Storage
 * Extracts path from the download URL
 */
export async function deleteProfilePhoto(downloadURL: string): Promise<void> {
  try {
    const storageRef = ref(storage, downloadURL);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Failed to delete profile photo:", error);
  }
}

/**
 * Create a file from a data URL (for drag-and-drop or paste)
 */
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

/**
 * Validate and prepare image file for upload
 * Resizes if needed to keep storage costs reasonable
 */
export async function prepareImageFile(file: File): Promise<File> {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Solo se permiten archivos de imagen");
  }

  // Validate file size (5MB limit)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("La imagen no puede superar los 5MB");
  }

  // If image is already small enough, return as-is
  if (file.size <= 1024 * 1024) {
    return file;
  }

  // For larger images, we could resize here if needed
  // For now, we'll just validate the size
  return file;
}

/**
 * Upload a team photo to Firebase Storage
 * Returns the public download URL
 */
export async function uploadTeamPhoto(
  teamId: string,
  file: File | Blob | Uint8Array,
): Promise<string> {
  const fileName = `photo-${Date.now()}`;
  const storageRef = ref(storage, `${TEAM_PHOTOS_PATH}/${teamId}/${fileName}`);

  await uploadBytes(storageRef, file, {
    contentType: file instanceof File ? file.type : "image/jpeg",
  });

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Delete a team photo from Firebase Storage
 */
export async function deleteTeamPhoto(downloadURL: string): Promise<void> {
  try {
    const storageRef = ref(storage, downloadURL);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Failed to delete team photo:", error);
  }
}
