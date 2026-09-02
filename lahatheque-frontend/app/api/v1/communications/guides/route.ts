import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/guides/${request.nextUrl.search}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    const data = await djangoRes.json();
    return NextResponse.json(data, { status: djangoRes.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Impossible de joindre la base de données Django PostgreSQL." },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

  try {
    const body = await request.json();
    const cookieHeader = request.headers.get("cookie") || "";
    const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/guides/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await djangoRes.json();
    return NextResponse.json(data, { status: djangoRes.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Échec de l'enregistrement dans la base de données Django PostgreSQL." },
      { status: 502 }
    );
  }
}
