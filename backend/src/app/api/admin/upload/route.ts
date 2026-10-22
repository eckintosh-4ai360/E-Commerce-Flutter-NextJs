import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

import { requireAdmin } from '@/lib/auth';
import { HttpError } from '@/lib/errors';
import { jsonResponse, privateNoStoreHeaders, route } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';

const maxBytes = 5 * 1024 * 1024;

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new HttpError(
      503,
      'Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.',
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/** Identifies the image type from its leading bytes; the browser-sent MIME type is not trusted. */
function detectImageType(bytes: Uint8Array) {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith([0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith([0x47, 0x49, 0x46, 0x38])) return 'gif';
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return 'webp';
  }
  return null;
}

export const POST = route(async (request) => {
  const admin = await requireAdmin(request);
  rateLimit(`admin:upload:${admin.email}`, { limit: 30, windowMs: 60_000 });
  configureCloudinary();

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > maxBytes + 64 * 1024) {
    throw new HttpError(413, 'File size must be under 5 MB.');
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new HttpError(400, 'Upload must be sent as multipart form data.');
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new HttpError(400, 'No file provided.');
  }
  if (file.size > maxBytes) {
    throw new HttpError(413, 'File size must be under 5 MB.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(buffer)) {
    throw new HttpError(400, 'Only JPG, PNG, WebP and GIF images are allowed.');
  }

  let result: UploadApiResponse;
  try {
    result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'globacart-gh/products', resource_type: 'image' },
          (error, response) => {
            if (error || !response) reject(error ?? new Error('Empty upload response'));
            else resolve(response);
          },
        )
        .end(buffer);
    });
  } catch (error) {
    console.error('[upload] Cloudinary upload failed', error);
    throw new HttpError(502, 'Upload failed. Please try again.');
  }

  return jsonResponse(
    { imagePath: result.secure_url, filename: result.public_id },
    { status: 201, headers: privateNoStoreHeaders },
  );
});
