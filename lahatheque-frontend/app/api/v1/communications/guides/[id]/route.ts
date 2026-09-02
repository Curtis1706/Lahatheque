import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const body = await request.json();
    const cookieHeader = request.headers.get("cookie") || "";
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/guides/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
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
  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const body = await request.json();
    const cookieHeader = request.headers.get("cookie") || "";
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/guides/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
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
  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/guides/${id}/`, {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
      },
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
