import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  let file = searchParams.get('file') || 'PromptBreeder_Original_Paper-2309.16797v1.pdf';
  
  // Clean file path (strip leading slash and get base name)
  file = file.replace(/^\/+/, '');
  const fileName = path.basename(file);
  const filePath = path.join(process.cwd(), 'public', fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`[API /api/pdf] ERREUR: Fichier introuvable sur le disque: ${filePath}`);
    return new NextResponse('Fichier PDF introuvable sur le serveur', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  console.log(`[API /api/pdf] Fichier "${fileName}" chargé avec succès (${fileBuffer.length} octets / ${(fileBuffer.length / 1024).toFixed(1)} KB) -> HTTP 200 OK`);
  
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': fileBuffer.length.toString(),
      'Accept-Ranges': 'none',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
