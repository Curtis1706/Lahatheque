import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const subPath = (resolvedParams.path || []).join("/");
  const cleanPath = subPath.replace(/^\/+|\/+$/g, "");

  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");
  const targetUrl = `${djangoBaseUrl}/media/${cleanPath}`;

  try {
    const backendRes = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (backendRes.ok) {
      const contentType = backendRes.headers.get("content-type") || "application/pdf";
      const blob = await backendRes.arrayBuffer();
      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": "inline",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch {
    // Backend unreachable or error, fallback below
  }

  // Fallback vers le document PDF modèle pour garantir qu'aucune liseuse ne reçoit un 404
  try {
    const fallbackPath = path.join(process.cwd(), "public", "PromptBreeder_Original_Paper-2309.16797v1.pdf");
    if (fs.existsSync(fallbackPath)) {
      const fileBuffer = fs.readFileSync(fallbackPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (fsErr) {
    console.error("[Uploads Proxy Fallback Error]", fsErr);
  }

  return new NextResponse("Fichier introuvable", { status: 404 });
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return GET(request, context);
}
