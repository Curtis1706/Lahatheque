import { NextRequest, NextResponse } from "next/server";
import { INITIAL_GUIDES, MockGuideArticle } from "@/lib/mock/guides";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    return NextResponse.json({
      id,
      ...body,
    });
  } catch {
    return NextResponse.json({ error: "Erreur de mise à jour" }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    return NextResponse.json({
      id,
      ...body,
    });
  } catch {
    return NextResponse.json({ error: "Erreur de mise à jour" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ success: true });
}
