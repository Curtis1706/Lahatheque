import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
      responseHeaders.set('Content-Type', backendRes.headers.get('content-type') || 'application/pdf');
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
    // Backend Django entièrement inaccessible (réseau coupé) :
    // Fallback de démonstration uniquement dans ce cas extrême
    const samplePath = path.join(process.cwd(), 'public', 'PromptBreeder_Original_Paper-2309.16797v1.pdf');
    if (!fs.existsSync(samplePath)) {
      return NextResponse.json(
        { success: false, error: 'Serveur de documents indisponible.' },
        { status: 503 }
      );
    }

    const stat = fs.statSync(samplePath);
    const totalSize = stat.size;

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : Math.min(start + 256 * 1024 - 1, totalSize - 1);
        const chunkSize = end - start + 1;

        const fd = fs.openSync(samplePath, 'r');
        const buffer = Buffer.alloc(chunkSize);
        fs.readSync(fd, buffer, 0, chunkSize, start);
        fs.closeSync(fd);

        return new NextResponse(buffer, {
          status: 206,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Cache-Control': 'private, no-store, must-revalidate',
          },
        });
      }
    }

    // Envoi standard 200 OK
    const fileBuffer = fs.readFileSync(samplePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Accept-Ranges': 'bytes',
        'Content-Length': totalSize.toString(),
        'Cache-Control': 'private, no-store, must-revalidate',
      },
    });
  }
}

