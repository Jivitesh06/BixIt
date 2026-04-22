/**
 * Cloudinary upload helpers for Bixit
 * Cloud: dwhzpc4gn | Preset: bixit_uploads (unsigned)
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a File object to Cloudinary.
 * @param {File} file       - The file to upload
 * @param {string} folder   - Cloudinary folder (e.g. "bixit/profiles")
 * @returns {Promise<string>} The secure URL of the uploaded image
 */
export async function uploadToCloudinary(file, folder = "bixit") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
}

/**
 * Transform a Cloudinary URL with width + auto quality/format.
 * Safe to call with null/undefined (returns null).
 * @param {string|null} url
 * @param {number} width
 */
export function getOptimizedUrl(url, width = 400) {
  if (!url || !url.includes("cloudinary.com")) return url || null;
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}
