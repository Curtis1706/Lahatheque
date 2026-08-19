import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DJANGO_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params
  const rawSubPath = (resolvedParams.path || []).join('/')
  const cleanSubPath = rawSubPath.replace(/^\/+|\/+$/g, '')
  const searchParams = request.nextUrl.search || ''
  const targetUrl = `${DJANGO_API_URL}/v1/${cleanSubPath}/${searchParams}`

  const accessToken = request.cookies.get('laha_access')?.value || request.cookies.get('access_token')?.value
  const authHeader = request.headers.get('authorization')

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers.set('content-type', contentType)
  }
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`)
  } else if (authHeader) {
    headers.set('authorization', authHeader)
  }


  let body: any = undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.text()
    } catch {
      body = undefined
    }
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body || undefined,
      cache: 'no-store',
    })

    const data = await backendRes.text()
    let jsonData: any = null
    try {
      jsonData = JSON.parse(data)
    } catch {
      jsonData = data
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

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context)
}
