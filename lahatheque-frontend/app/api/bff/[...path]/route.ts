import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rawApiUrl = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '')
const DJANGO_API_URL = rawApiUrl.replace('localhost:8000', '127.0.0.1:8000').replace(/\/v1$/, '').replace(/\/api$/, '') + '/api'

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  const rawSubPath = (resolvedParams.path || []).join('/')
  const cleanSubPath = rawSubPath.replace(/^\/+|\/+$/g, '')
  const searchParams = request.nextUrl.search || ''
  const targetUrl = `${DJANGO_API_URL}/v1/${cleanSubPath}/${searchParams}`

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers.set('content-type', contentType)
  }
  const origin = request.headers.get('origin')
  if (origin) {
    headers.set('origin', origin)
  }
  const referer = request.headers.get('referer')
  if (referer) {
    headers.set('referer', referer)
  }

  const accessToken = request.cookies.get('laha_access')?.value || request.cookies.get('access_token')?.value
  const authHeader = request.headers.get('authorization')
  const readerToken = request.headers.get('x-reader-token')
  if (readerToken) {
    headers.set('x-reader-token', readerToken)
  }

  const isReaderSessionRoute = cleanSubPath.startsWith('reader/sessions')
  if (isReaderSessionRoute && (authHeader || readerToken)) {
    if (authHeader) headers.set('authorization', authHeader)
  } else if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`)
  } else if (authHeader) {
    headers.set('authorization', authHeader)
  }


  let body: any = undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      if (contentType && contentType.includes('multipart/form-data')) {
        body = await request.arrayBuffer()
      } else {
        body = await request.text()
      }
    } catch {
      body = undefined
    }
  }

  try {
    let backendRes: Response | null = null
    try {
      backendRes = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: body || undefined,
        cache: 'no-store',
      })
    } catch (netErr) {
      if (targetUrl.includes('localhost')) {
        const ipv4Url = targetUrl.replace('localhost', '127.0.0.1')
        backendRes = await fetch(ipv4Url, {
          method: request.method,
          headers: headers,
          body: body || undefined,
          cache: 'no-store',
        })
      } else {
        throw netErr
      }
    }

    const data = await backendRes.text()
    let jsonData: any = null
    try {
      jsonData = JSON.parse(data)
    } catch {
      jsonData = data
    }

    if (cleanSubPath.includes("reader/sessions")) {
      console.log(`[BFF Proxy] ${request.method} /${cleanSubPath} -> HTTP ${backendRes.status} | Ouvrage: "${jsonData?.data?.book?.title || 'N/A'}" | URL fichier: "${jsonData?.data?.book?.file_url || 'N/A'}"`);
    } else {
      console.log(`[BFF Proxy] ${request.method} /${cleanSubPath} -> HTTP ${backendRes.status}`);
    }

    return NextResponse.json(jsonData, { status: backendRes.status })
  } catch (error) {
    console.error(`[BFF Proxy Error] ${request.method} ${targetUrl}:`, error)
    return NextResponse.json(
      { error: 'Impossible de contacter le serveur backend' },
      { status: 502 }
    )
  }
}

export async function GET(request: NextRequest, context: any) {
  return handleProxy(request, context)
}

export async function POST(request: NextRequest, context: any) {
  return handleProxy(request, context)
}

export async function PUT(request: NextRequest, context: any) {
  return handleProxy(request, context)
}

export async function PATCH(request: NextRequest, context: any) {
  return handleProxy(request, context)
}

export async function DELETE(request: NextRequest, context: any) {
  return handleProxy(request, context)
}
