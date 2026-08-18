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
    return new NextResponse('Fichier PDF introuvable sur le serveur', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  
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
