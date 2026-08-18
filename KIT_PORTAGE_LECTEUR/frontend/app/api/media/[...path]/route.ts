import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleMediaRequest(request, params, 'GET')
}

export async function HEAD(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleMediaRequest(request, params, 'HEAD')
}

export async function OPTIONS(request: NextRequest, { params }: { params: { path: string[] } }) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
    },
  })
}

async function handleMediaRequest(request: NextRequest, params: { path: string[] }, method: 'GET' | 'HEAD') {
  try {
    const filePath = params.path.join('/')
    const baseApi = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
    const mediaUrl = `${baseApi}/media/${filePath}`

    console.log('📁 Récupération du fichier média:', filePath)
    console.log(`  URL complète: ${mediaUrl}`)

    // Faire une requête vers Django pour récupérer le fichier
    const response = await fetch(mediaUrl, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Erreur lors de la récupération du fichier:', response.status)
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      )
    }

    // Déterminer le type de contenu
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentLength = response.headers.get('content-length')
    const lastModified = response.headers.get('last-modified')
    
    // Headers pour la lecture vidéo
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
      'Accept-Ranges': 'bytes',
    }
    
    // Ajouter les headers optionnels s'ils existent
    if (contentLength) headers['Content-Length'] = contentLength
    if (lastModified) headers['Last-Modified'] = lastModified
    
    if (method === 'HEAD') {
      // Pour HEAD, retourner seulement les headers
      return new NextResponse(null, {
        status: 200,
        headers,
      })
    }
    
    // Pour les vidéos, utiliser le streaming direct
    if (contentType.startsWith('video/') || contentType.startsWith('audio/')) {
      // Streamer directement sans charger en mémoire
      return new NextResponse(response.body, {
        status: 200,
        headers,
      })
    }
    
    // Pour les autres fichiers (images, documents), charger en mémoire
    const fileBuffer = await response.arrayBuffer()
    
    // Retourner le fichier avec les bons headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error('Erreur API media GET:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
