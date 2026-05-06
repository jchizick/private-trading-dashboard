export const GAMMA_IMAGE_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp"
] as const;

export const GAMMA_IMAGE_MAX_BYTES = 3 * 1024 * 1024;

export type GammaImageValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateGammaImageFile(file: Pick<File, "size" | "type">): GammaImageValidationResult {
  if (!GAMMA_IMAGE_ACCEPTED_TYPES.includes(file.type as (typeof GAMMA_IMAGE_ACCEPTED_TYPES)[number])) {
    return { ok: false, error: "Choose a PNG, JPG, or WEBP image." };
  }

  if (file.size > GAMMA_IMAGE_MAX_BYTES) {
    return { ok: false, error: "Image must be 3 MB or smaller." };
  }

  return { ok: true };
}

export function readGammaImageFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Selected image could not be read."));
    };

    reader.onerror = () => reject(new Error("Selected image could not be read."));
    reader.readAsDataURL(file);
  });
}
