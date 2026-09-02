import { NextRequest, NextResponse } from "next/server";
import { INITIAL_GUIDES, MockGuideArticle } from "@/lib/mock/guides";

// Stockage en mémoire partagé pour la session
let guidesStore: MockGuideArticle[] = [...INITIAL_GUIDES];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  let results = guidesStore;
  if (role && role !== "all") {
    results = guidesStore.filter((g) => g.target_role === role || g.target_role === "all");
  }

  return NextResponse.json({
    count: results.length,
    results: results,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    guidesStore.unshift(newGuide);
    return NextResponse.json(newGuide, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
}
