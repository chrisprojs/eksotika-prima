import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Route: /api/images/<anything>/<anything>/<file>
export async function GET(req, { params }) {
  try {
    const { imageDirectory: segments } = await params;

    if (!segments || segments.length === 0) {
      return NextResponse.json({ error: "Path required" }, { status: 400 });
    }

    const assetRoot = path.join(process.cwd(), "public", "asset");
    const relativePath = path.normalize(segments.join(path.sep));
    const filePath = path.join(assetRoot, relativePath);

    if (!filePath.startsWith(assetRoot + path.sep)) {
      return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);

    const ext = path.extname(filePath).toLowerCase();
    const types = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    const contentType = types[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
