import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DJANGO_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

/**
 * Route Handler BFF pour le rendu ultra-rapide de pages individuelles en JPEG.
 * Modèle Scribd / Internet Archive — chaque page est servie en ~30ms depuis le cache NVMe.
 * Relaye vers GET /api/v1/catalog/books/{id}/page/?page={n}&lang={lang}
 */
export async function GET(
  request: NextRequest,
  context: any
) {
  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';
  const lang = searchParams.get('lang') || 'fr';
  const targetUrl = `${DJANGO_API_URL}/v1/catalog/books/${id}/page/?page=${encodeURIComponent(page)}&lang=${encodeURIComponent(lang)}`;

  const accessToken = request.cookies.get('laha_access')?.value || request.cookies.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');

  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  const rawCookie = request.headers.get('cookie');
  if (rawCookie) {
    headers.set('Cookie', rawCookie);
  }

  const deviceFingerprint = request.headers.get('x-device-fingerprint');
  if (deviceFingerprint) {
    headers.set('X-Device-Fingerprint', deviceFingerprint);
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
      cache: 'no-store',
    });

    if (backendRes.status === 200) {
      const imageBuffer = await backendRes.arrayBuffer();
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', 'image/jpeg');
      responseHeaders.set('Cache-Control', 'private, max-age=86400, must-revalidate');
      responseHeaders.set('Content-Length', String(imageBuffer.byteLength));
      responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
      responseHeaders.set('X-Content-Type-Options', 'nosniff');

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: responseHeaders,
      });
    }

    // Erreur d'accès ou page introuvable
    const errorText = await backendRes.text().catch(() => '');
    console.error(`[BFF/catalog/page] Backend ${backendRes.status} pour ${id}/page=${page}:`, errorText);

    return NextResponse.json(
      { success: false, error: `Erreur backend: ${backendRes.status}` },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[BFF/catalog/page] Erreur proxy:', err);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement de la page.' },
      { status: 500 }
    );
  }
}
