import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WebP, and GIF images are allowed.' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be under 5 MB.' }, { status: 400 });
    }

    // Build a clean filename: lowercase, spaces → hyphens, keep extension
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const baseName = file.name
      .replace(/\.[^/.]+$/, '')      // remove extension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // replace non-alphanumeric with hyphen
      .replace(/^-|-$/g, '');       // strip leading/trailing hyphens

    const filename = `${baseName}-${Date.now()}.${ext}`;

    // Ensure public/products directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'products');
    await mkdir(uploadDir, { recursive: true });

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, filename), buffer);

    const imagePath = `/products/${filename}`;
    return NextResponse.json({ imagePath, filename }, { status: 201 });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
