import { NextRequest, NextResponse } from "next/server";
import { getGuidesStore, addGuideToStore, MockGuideArticle } from "@/lib/mock/guides";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

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

    if (djangoRes.ok) {
      const data = await djangoRes.json();
      const list = Array.isArray(data) ? data : (data?.results || []);
      if (list.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // Mode fallback mémoire local
  }

  const store = getGuidesStore();
  let results = store;
  if (role && role !== "all") {
    results = store.filter((g) => g.target_role === role || g.target_role === "all");
  }

  return NextResponse.json({
    count: results.length,
    results: results,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
    const djangoBaseUrl = rawApiUrl.replace(/\/api$/, "").replace("localhost:8000", "127.0.0.1:8000");

    try {
      const cookieHeader = request.headers.get("cookie") || "";
      const djangoRes = await fetch(`${djangoBaseUrl}/api/v1/communications/guides/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify(body),
      });

      if (djangoRes.ok) {
        const data = await djangoRes.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch {}

    const newGuide: MockGuideArticle = {
      id: `guide-${Date.now()}`,
      target_role: body.target_role || "student",
      category_label: body.category_label || "Général",
      title: body.title || "Sans titre",
      summary: body.summary || body.title || "",
      content: body.content || "",
      icon_name: body.icon_name || "BookOpen",
      order: Number(body.order) || 0,
      is_published: body.is_published !== undefined ? body.is_published : true,
      created_at: new Date().toISOString(),
    };

    addGuideToStore(newGuide);
    return NextResponse.json(newGuide, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}
