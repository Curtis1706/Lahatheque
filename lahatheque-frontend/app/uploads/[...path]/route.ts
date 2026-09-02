import { NextRequest, NextResponse } from "next/server";

const SENSITIVE_PREFIXES = ["contrats/", "manuscripts/", "publisher_deposits/"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const subPath = (resolvedParams.path || []).join("/");
  const cleanPath = subPath.replace(/^\/+|\/+$/g, "");

  const isSensitive = SENSITIVE_PREFIXES.some((prefix) => cleanPath.startsWith(prefix));

  if (isSensitive) {
    const accessToken =
      request.cookies.get("laha_access")?.value ||
      request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return new NextResponse("Authentification requise.", { status: 401 });
    }

    return new NextResponse(
      "Ce type de document doit être consulté via son endpoint sécurisé dédié.",
      { status: 403 }
    );
  }

  const r2PublicDomain = (
    process.env.NEXT_PUBLIC_R2_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    "https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev"
  ).replace(/\/+$/, "");
  const targetR2Url = `${r2PublicDomain}/${cleanPath}`;

  try {
    const r2Res = await fetch(targetR2Url, { method: "GET", cache: "no-store" });
    if (r2Res.ok) {
      const contentType = r2Res.headers.get("content-type") || "application/octet-stream";
      const blob = await r2Res.arrayBuffer();
      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": "inline",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  } catch {
    // R2 indisponible, continuer vers Django media
  }

  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");
  const targetUrl = `${djangoBaseUrl}/media/${cleanPath}`;

  try {
    const backendRes = await fetch(targetUrl, { method: "GET", cache: "no-store" });
    if (backendRes.ok) {
      const contentType = backendRes.headers.get("content-type") || "application/octet-stream";
      const blob = await backendRes.arrayBuffer();
      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": "inline",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  } catch {
    // Backend inaccessible
  }

  return new NextResponse("Fichier introuvable.", { status: 404 });
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return GET(request, context);
}
