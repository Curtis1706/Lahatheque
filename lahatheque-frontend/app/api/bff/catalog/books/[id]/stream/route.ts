import { NextRequest, NextResponse } from 'next/server';

const DJANGO_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

/**
 * Route Handler BFF pour le streaming d'ouvrage Range HTTP 206.
 * Relaye vers Django avec fallback autonome vers le document d'exemple local.
 */
export async function GET(
  request: NextRequest,
  context: any
) {
  const { id } = await context.params;
  const targetUrl = `${DJANGO_API_URL}/v1/catalog/books/${id}/stream/`;

  const accessToken = request.cookies.get('laha_access')?.value || request.cookies.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');

  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    headers.set('Range', rangeHeader);
  }

  const deviceFingerprint = request.headers.get('x-device-fingerprint');
  if (deviceFingerprint) {
    headers.set('X-Device-Fingerprint', deviceFingerprint);
  }

  // 1. Tenter la récupération en direct depuis le backend Django
  try {
    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
      cache: 'no-store',
    });

    // Seuls 200 et 206 contiennent un corps PDF valide
    if (backendRes.status === 200 || backendRes.status === 206) {

      const responseHeaders = new Headers();
      // Utiliser application/octet-stream au lieu de application/pdf pour éviter
      // qu'IDM (Internet Download Manager) et autres gestionnaires de téléchargement
      // n'interceptent la réponse. pdf.js lit l'ArrayBuffer directement peu importe
      // le Content-Type. Content-Disposition: inline indique au navigateur de ne pas
      // déclencher un téléchargement.
      responseHeaders.set('Content-Type', 'application/octet-stream');
      responseHeaders.set('Content-Disposition', 'inline; filename="document.bin"');
      responseHeaders.set('Accept-Ranges', 'bytes');
      responseHeaders.set('Cache-Control', 'private, no-store, must-revalidate');
      responseHeaders.set('X-Content-Type-Options', 'nosniff');

      const contentRange = backendRes.headers.get('content-range');
      if (contentRange) responseHeaders.set('Content-Range', contentRange);

      const contentLength = backendRes.headers.get('content-length');
      if (contentLength) responseHeaders.set('Content-Length', contentLength);

      const arrayBuffer = await backendRes.arrayBuffer();
      return new NextResponse(Buffer.from(arrayBuffer), {
        status: backendRes.status,
        headers: responseHeaders,
      });
    }

    // Django a répondu mais avec une erreur (401, 403, 404, 500...) :
    // Propager le statut exact au lieu de servir un document fallback étranger
    let errorMessage = 'Document indisponible';
    try {
      const errorBody = await backendRes.json();
      errorMessage = errorBody?.error || errorBody?.detail || errorMessage;
    } catch {
      // Body non-JSON, garder le message par défaut
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: backendRes.status }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Serveur de documents indisponible. Veuillez réessayer dans quelques instants.' },
      { status: 503 }
    );
  }
}

