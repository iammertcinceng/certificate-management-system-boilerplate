import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";

// POST /api/upload/logo - Upload and optimize logo
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as string | undefined;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize image with sharp
    // Target: 200x200px, square, optimized for web
    const optimizedBuffer = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `logo-${timestamp}-${randomStr}.webp`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logos');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, optimizedBuffer);

    // Return public URL
    const publicUrl = `/uploads/logos/${filename}`;

    return NextResponse.json({ 
      url: publicUrl,
      filename,
      size: optimizedBuffer.length,
      dimensions: { width: 200, height: 200 },
    }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/upload/logo error", err);
    return NextResponse.json({ 
      error: "Upload failed"}, { status: 500 });
  }
}
