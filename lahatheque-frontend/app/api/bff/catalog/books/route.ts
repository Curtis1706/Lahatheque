import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const rawApiUrl = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const DJANGO_API_URL =
  rawApiUrl
    .replace("localhost:8000", "127.0.0.1:8000")
    .replace(/\/v1$/, "")
    .replace(/\/api$/, "") + "/api";

/**
 * Route Handler BFF pour le catalogue public des livres (/api/bff/catalog/books/).
 * Relaye directement vers Django /api/v1/catalog/books/ avec support des query params et cookies.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  // Si un paramètre 'format' métier est fourni (ex: digital, audio, paper),
  // on le mappe en 'book_format' et on retire 'format' pour que
  // Django Rest Framework ne le confonde pas avec un format de rendu renderer (?format=json, ?format=api)
  const formatVal = searchParams.get("format");
  if (formatVal && !["json", "api"].includes(formatVal.toLowerCase())) {
    searchParams.set("book_format", formatVal);
    searchParams.delete("format");
  }

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const targetUrl = `${DJANGO_API_URL}/v1/catalog/books/${queryStr}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  // Transmission de l'IP publique cliente
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) headers.set("cf-connecting-ip", cfConnectingIp);

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) headers.set("x-real-ip", xRealIp);

  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    headers.set("x-forwarded-for", xForwardedFor);
  } else if (cfConnectingIp || xRealIp) {
    headers.set("x-forwarded-for", (cfConnectingIp || xRealIp)!);
  }

  const accessToken =
    request.cookies.get("laha_access")?.value ||
    request.cookies.get("access_token")?.value;
  const authHeader = request.headers.get("authorization");

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  } else if (authHeader) {
    headers.set("authorization", authHeader);
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await backendRes.json();
    const isPublic = !accessToken && !authHeader;
    return NextResponse.json(data, {
      status: backendRes.status,
      headers: {
        "cache-control": isPublic
          ? "public, s-maxage=60, stale-while-revalidate=300"
          : "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[BFF Proxy Error] /api/bff/catalog/books/ failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur de connexion au catalogue distant",
        results: [],
        count: 0,
      },
      { status: 502 }
    );
  }
}
