import { NextRequest, NextResponse } from "next/server";

function getForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  headers.set("content-type", "application/json");

  const cookieHeader = request.headers.get("cookie") || "";
  if (cookieHeader) headers.set("cookie", cookieHeader);

  const accessToken =
    request.cookies.get("laha_access")?.value ||
    request.cookies.get("access_token")?.value;
  const authHeader = request.headers.get("authorization");

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  } else if (authHeader) {
    headers.set("authorization", authHeader);
  }

  return headers;
}

export async function GET(request: NextRequest) {
  const rawApiUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const headers = getForwardHeaders(request);
    const search = request.nextUrl.search || "";
    console.log(`[API /admin/guides/articles/] GET vers Django: ${djangoBaseUrl}/api/v1/communications/admin/guides/articles/${search}`);
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/admin/guides/articles/${search}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await djangoRes.json();
    console.log(`[API /admin/guides/articles/] GET reçu (${djangoRes.status}):`, Array.isArray(data) ? `${data.length} articles` : data);
    return NextResponse.json(data, { status: djangoRes.status });
  } catch (err: any) {
    console.error("[API /admin/guides/articles/] Erreur GET:", err);
    return NextResponse.json(
      { error: "Impossible de joindre la base de données Django PostgreSQL." },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rawApiUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const body = await request.json();
    const headers = getForwardHeaders(request);
    console.log(`[API /admin/guides/articles/] POST vers Django:`, body);
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/admin/guides/articles/`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await djangoRes.json();
    console.log(`[API /admin/guides/articles/] POST réponse (${djangoRes.status}):`, data);
    return NextResponse.json(data, { status: djangoRes.status });
  } catch (err: any) {
    console.error("[API /admin/guides/articles/] Erreur POST:", err);
    return NextResponse.json(
      { error: "Échec de l'enregistrement de l'article dans PostgreSQL." },
      { status: 502 }
    );
  }
}
