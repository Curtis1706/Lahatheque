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

  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  // 1. Essayer le proxy streaming Django R2 authentifié (boto3)
  try {
    const r2StreamUrl = `${djangoBaseUrl}/api/v1/catalog/my-deposits/r2-media/?key=${encodeURIComponent(cleanPath)}`;
    const r2StreamRes = await fetch(r2StreamUrl, { method: "GET", cache: "no-store" });
    if (r2StreamRes.ok) {
      const contentType = r2StreamRes.headers.get("content-type") || "application/octet-stream";
      const blob = await r2StreamRes.arrayBuffer();
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
    // Continuer vers URL R2 directe
  }

  // 2. Essayer les URLs R2 publiques directes
  const r2Domains = [
    process.env.NEXT_PUBLIC_R2_URL,
    process.env.CLOUDFLARE_R2_PUBLIC_URL,
    "https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev",
    "https://pub-04ee70fd927649918bb42c881e0db428.r2.dev",
  ].filter(Boolean);

  for (const domain of r2Domains) {
    try {
      const cleanDomain = domain!.replace(/\/+$/, "");
      const targetR2Url = `${cleanDomain}/${cleanPath}`;
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
      // Tester domaine suivant
    }
  }

  // 3. Fallback standard vers le stockage média Django local
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
