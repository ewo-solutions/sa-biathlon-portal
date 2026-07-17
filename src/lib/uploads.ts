const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// Stores images as base64 data URIs directly on the row. Fine for a demo/early
// build; swap for real object storage (Vercel Blob/S3) before production —
// see README "Known gaps".
export async function fileToDataUri(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be smaller than 4MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}
