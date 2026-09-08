import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const rawApiUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
const DJANGO_API_URL = rawApiUrl.replace('localhost:8000', '127.0.0.1:8000').replace(/\/v1$/, '').replace(/\/api$/, '') + '/api';

export async function GET(request: NextRequest) {
  const targetUrl = `${DJANGO_API_URL}/v1/partners/institutions/`;

  const headers = new Headers();
  headers.set('accept', 'application/json');

  const accessToken = request.cookies.get('laha_access')?.value || request.cookies.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');

  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  } else if (authHeader) {
    headers.set('authorization', authHeader);
  }

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.results || data.data || []);
    return NextResponse.json({
      success: res.ok,
      data: list,
      error: res.ok ? null : (data.error || 'Erreur lors de la récupération des institutions partenaires.')
    }, { status: res.status });
  } catch (error) {
    console.error('[BFF Partners Institutions Error]', error);
    return NextResponse.json({
      success: false,
      data: [],
      error: 'Impossible de contacter le serveur backend pour récupérer les institutions.'
    }, { status: 502 });
  }
}
