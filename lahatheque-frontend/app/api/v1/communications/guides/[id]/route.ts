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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rawApiUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const body = await request.json();
    const headers = getForwardHeaders(request);
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/guides/${id}/`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    const data = await djangoRes.json();
    return NextResponse.json(data, { status: djangoRes.status });
  } catch {
    return NextResponse.json(
      { error: "Impossible de modifier l'article dans la base de données." },
      { status: 502 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rawApiUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const body = await request.json();
    const headers = getForwardHeaders(request);
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/guides/${id}/`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const data = await djangoRes.json();
    return NextResponse.json(data, { status: djangoRes.status });
  } catch {
    return NextResponse.json(
      { error: "Impossible de modifier l'article dans la base de données." },
      { status: 502 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rawApiUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const headers = getForwardHeaders(request);
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/guides/${id}/`, {
      method: "DELETE",
      headers,
    });

    if (djangoRes.status === 204 || djangoRes.ok) {
      return NextResponse.json({ success: true });
    }
    const data = await djangoRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: djangoRes.status });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer l'article de la base de données." },
      { status: 502 }
    );
  }
}
