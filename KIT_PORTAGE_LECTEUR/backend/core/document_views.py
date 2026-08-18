import os
import mimetypes
import fitz  # PyMuPDF
import requests
import io
import urllib.request
from django.conf import settings
from django.http import FileResponse, HttpResponse, HttpResponseRedirect, StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.clickjacking import xframe_options_exempt
import logging
import struct
from urllib.parse import urlparse

ALLOWED_PROXY_DOMAINS = {
    'res.cloudinary.com',
    'cloudinary.com',
    'pub-04ee70fd927649918bb42c881e0db428.r2.dev',
    'cloudflarestream.com',
    'lahaacademia.com',
}

def _is_allowed_url(url: str) -> bool:
    if not url.startswith('http'):
        return True
    parsed = urlparse(url)
    if not parsed.hostname:
        return False
    return any(
        parsed.hostname == d or parsed.hostname.endswith('.' + d)
        for d in ALLOWED_PROXY_DOMAINS
    )

logger = logging.getLogger(__name__)

def _resolve_to_url_or_path(file_path: str) -> str:
    """Résout un path relatif en URL externe ou retourne le path nettoyé."""
    if file_path.startswith('http'):
        return file_path
    clean = file_path.replace('../', '').lstrip('/')
    if clean.startswith('media/'):
        clean = clean[6:]
    try:
        from django.core.files.storage import default_storage
        url = str(default_storage.url(clean))
        if url.startswith('http'):
            return url
    except Exception as e:
        logger.error(f"Erreur default_storage.url: {e}")
    return clean

@api_view(['GET'])
@permission_classes([AllowAny])
@xframe_options_exempt  # autorise l'affichage dans un iframe / viewer depuis localhost:3000
def preview_document(request):
    file_path = request.query_params.get('path')
    if not file_path:
        return Response({'error': 'Le paramètre path est requis'}, status=status.HTTP_400_BAD_REQUEST)

    download = request.query_params.get('download') == '1'
    
    file_path = _resolve_to_url_or_path(file_path)

    # Si c'est une URL Cloudinary ou externe
    if file_path.startswith('http'):
        # On peut forcer l'extension si fournie par le paramètre force_ext
        force_ext = request.query_params.get('force_ext')
        if 'cloudinary.com' in file_path and force_ext:
            if '.' not in file_path.split('/')[-1]:
                file_path = file_path + f'.{force_ext}'

        if download and 'cloudinary.com' in file_path and '/upload/' in file_path:
            # Forcer le téléchargement via l'API Cloudinary
            if '/fl_attachment' not in file_path:
                file_path = file_path.replace('/upload/', '/upload/fl_attachment/')
                
        return HttpResponseRedirect(file_path)

    clean_path = file_path.replace('../', '').lstrip('/')
    if clean_path.startswith('media/'):
        clean_path = clean_path[6:]

    document_path = os.path.abspath(os.path.join(settings.MEDIA_ROOT, clean_path))

    if not document_path.startswith(os.path.abspath(settings.MEDIA_ROOT)):
        return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    if not os.path.exists(document_path):
        return Response({'error': f'Document introuvable: {clean_path}'}, status=status.HTTP_404_NOT_FOUND)

    ext = os.path.splitext(document_path)[1].lower()
    if ext == '.pdf':
        content_type = 'application/pdf'
    else:
        content_type = mimetypes.guess_type(document_path)[0] or 'application/octet-stream'

    filename = os.path.basename(document_path)

    try:
        response = FileResponse(open(document_path, 'rb'), content_type=content_type)
        if download:
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
        else:
            response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['X-Content-Type-Options'] = 'nosniff'
        return response
    except Exception as e:
        return Response({'error': f'Erreur lors de la lecture du document: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _get_document_stream(file_path):
    """Télécharge le document s'il est externe ou l'ouvre localement"""
    original_path = file_path
    file_path = _resolve_to_url_or_path(file_path)

    # Si on a (ou on avait déjà) récupéré une URL http
    if file_path.startswith('http'):
        # Pour Cloudinary, si c'est un PDF sans extension, on s'assure d'ajouter .pdf
        if 'cloudinary.com' in file_path and '.' not in file_path.split('/')[-1]:
            file_path = file_path + '.pdf'
            
        # Ajout d'un User-Agent classique pour éviter le blocage par Cloudflare ou les pares-feux
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        # Note: On charge tout en mémoire (BytesIO) car PyMuPDF (fitz) a besoin d'un flux supportant seek()
        try:
            response = requests.get(file_path, headers=headers, timeout=(5, 30))
            if response.status_code == 200:
                return io.BytesIO(response.content)
            logger.warning(f"Impossible de télécharger le fichier distant: {response.status_code}. Tentative de fallback local.")
        except Exception as e:
            logger.warning(f"Erreur téléchargement distant: {e}. Tentative de fallback local.")
    
    # Fallback pour le stockage local strict
    clean_path = original_path.lstrip('/')
    if clean_path.startswith('media/'): clean_path = clean_path[6:]
    document_path = os.path.realpath(os.path.join(settings.MEDIA_ROOT, clean_path))
    media_root = os.path.realpath(settings.MEDIA_ROOT)
    
    if not document_path.startswith(media_root + os.sep) or not os.path.exists(document_path):
        raise FileNotFoundError(f"Fichier introuvable ou accès refusé")
    
    return open(document_path, 'rb')

@api_view(['GET'])
@permission_classes([AllowAny])
def get_pdf_info(request):
    """Renvoie les métadonnées du document : PDF ou image"""
    file_path = request.query_params.get('path')
    if not file_path:
        return Response({'error': 'Path requis'}, status=400)
    
    try:
        stream = _get_document_stream(file_path)
        header = stream.read(10)
        stream.seek(0)
        
        # Détection du type de fichier via les magic bytes
        if header.startswith(b'%PDF-'):
            doc = fitz.open(stream=stream, filetype="pdf")
            num_pages = len(doc)
            doc.close()
            return Response({'type': 'pdf', 'num_pages': num_pages})
        elif header.startswith(b'\xff\xd8'):
            return Response({'type': 'image', 'format': 'jpeg'})
        elif header.startswith(b'\x89PNG\r\n\x1a\n'):
            return Response({'type': 'image', 'format': 'png'})
        elif header.startswith(b'GIF87a') or header.startswith(b'GIF89a'):
            return Response({'type': 'image', 'format': 'gif'})
        elif header.startswith(b'RIFF') and header[8:12] == b'WEBP':
            return Response({'type': 'image', 'format': 'webp'})
            
        return Response({'type': 'unknown'})
    except Exception as e:
        logger.error(f"Erreur get_pdf_info: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_pdf_page(request):
    """Convertit une page de PDF en image JPEG et la renvoie"""
    file_path = request.query_params.get('path')
    page_num = int(request.query_params.get('page', 0))
    
    if not file_path:
        return Response({'error': 'Path requis'}, status=400)
    
    try:
        stream = _get_document_stream(file_path)
        doc = fitz.open(stream=stream, filetype="pdf")
        if page_num >= len(doc):
            return Response({'error': 'Index de page hors limites'}, status=400)
        
        page = doc.load_page(page_num)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # Zoom x2 pour la qualité
        img_data = pix.tobytes("jpg")
        doc.close()
        return HttpResponse(img_data, content_type="image/jpeg")
    except Exception as e:
        logger.error(f"Erreur get_pdf_page: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_pdf_text_all_pages(request):
    """
    Extrait le texte de toutes les pages d'un document PDF.
    Retourne un tableau indexé par numéro de page.
    """
    file_path = request.query_params.get('document_id') or request.query_params.get('path')
    
    if not file_path:
        return Response({'error': 'Paramètre document_id (ou path) requis'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        stream = _get_document_stream(file_path)
        doc = fitz.open(stream=stream, filetype="pdf")
        
        pages_data = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text").strip()
            
            is_empty = len(text) < 10
            
            pages_data.append({
                "page_number": page_num,
                "text": text,
                "is_empty": is_empty
            })
            
        total_pages = len(doc)
        doc.close()
        
        return Response({
            "total_pages": total_pages,
            "pages": pages_data
        })
        
    except FileNotFoundError as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
    except fitz.FileDataError as e:
        logger.error(f"Erreur PyMuPDF: {str(e)}")
        return Response({'error': f"Document illisible ou corrompu: {str(e)}"}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except Exception as e:
        logger.error(f"Erreur get_pdf_text_all_pages: {str(e)}")
        return Response({'error': f"Erreur de lecture: {str(e)}"}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)


def _parse_range_header(range_header, file_size):
    if not range_header:
        return None
    if not range_header.startswith('bytes='):
        raise ValueError('Range invalide')

    range_spec = range_header.split('=', 1)[1].split(',', 1)[0].strip()
    if '-' not in range_spec:
        raise ValueError('Range invalide')

    start_str, end_str = range_spec.split('-', 1)
    if not start_str and not end_str:
        raise ValueError('Range invalide')

    if not start_str:
        suffix_length = int(end_str)
        if suffix_length <= 0:
            raise ValueError('Range invalide')
        start = max(file_size - suffix_length, 0)
        end = file_size - 1
    else:
        start = int(start_str)
        end = int(end_str) if end_str else file_size - 1

    if start < 0 or start >= file_size or end < start:
        raise ValueError('Range hors limites')

    return start, min(end, file_size - 1)


def _file_range_iterator(path, start, end, chunk_size=8192):
    with open(path, 'rb') as file_obj:
        file_obj.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            chunk = file_obj.read(min(chunk_size, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


def _remote_stream_iterator(remote_response):
    try:
        for chunk in remote_response.iter_content(chunk_size=8192):
            if chunk:
                yield chunk
    finally:
        remote_response.close()


def _apply_document_proxy_headers(response, content_length=None, content_range=None):
    # Use a custom MIME type so IDM/download managers cannot identify it as a PDF to intercept.
    # The frontend JavaScript reconstructs a proper blob:// URL with application/pdf type.
    response['Content-Disposition'] = 'inline; filename="stream"'
    response['X-Content-Type-Options'] = 'nosniff'
    response['X-Robots-Tag'] = 'noindex'
    response['Accept-Ranges'] = 'bytes'
    response['Cache-Control'] = 'private, no-store'
    response['Vary'] = 'Range'
    response['Access-Control-Allow-Headers'] = 'Range, Content-Range, Content-Length, Content-Type'
    response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges'
    if content_length is not None:
        response['Content-Length'] = str(content_length)
    if content_range:
        response['Content-Range'] = content_range
    return response


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@xframe_options_exempt
def proxy_document(request):
    """
    Sert le document PDF directement via le backend (Proxy).
    Supporte les requêtes Range pour permettre à PDF.js de charger uniquement
    les morceaux nécessaires sans exposer l'URL de stockage au navigateur.
    """
    original_path = request.query_params.get('path') or request.data.get('path')
    if not original_path:
        return Response({'error': 'Path requis'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        range_header = request.headers.get('Range')
        
        file_path = _resolve_to_url_or_path(original_path)
        
        if not _is_allowed_url(file_path):
            return Response({'error': 'Domaine non autorisé'}, status=status.HTTP_403_FORBIDDEN)

        fallback_to_local = False

        if file_path.startswith('http'):
            if 'cloudinary.com' in file_path and '.' not in file_path.split('/')[-1]:
                file_path = file_path + '.pdf'

            import requests
            headers = {'User-Agent': 'Mozilla/5.0'}
            if range_header:
                headers['Range'] = range_header
                
            try:
                remote_res = requests.get(file_path, headers=headers, stream=True, timeout=(5, 30))
                if remote_res.status_code in (200, 206):
                    response = StreamingHttpResponse(
                        _remote_stream_iterator(remote_res),
                        status=remote_res.status_code,
                        content_type='application/x-pdf-viewer'
                    )
                    content_length = remote_res.headers.get('Content-Length')
                    content_range = remote_res.headers.get('Content-Range')
                    _apply_document_proxy_headers(response, content_length=content_length, content_range=content_range)
                    return response
                else:
                    logger.warning(f"[PROXY] Remote fetch failed ({remote_res.status_code}) for {file_path}. Fallback local.")
                    fallback_to_local = True
            except Exception as e:
                logger.error(f"Erreur remote proxy streaming: {e}. Fallback local.")
                fallback_to_local = True
        else:
            fallback_to_local = True

        if fallback_to_local:
            clean_path = original_path.lstrip('/')
            if clean_path.startswith('media/'): clean_path = clean_path[6:]
            document_path = os.path.realpath(os.path.join(settings.MEDIA_ROOT, clean_path))
            media_root = os.path.realpath(settings.MEDIA_ROOT)
            
            if not document_path.startswith(media_root + os.sep) or not os.path.exists(document_path):
                raise FileNotFoundError(f"Fichier introuvable ou accès refusé")
            
            file_size = os.path.getsize(document_path)
            if range_header:
                try:
                    start, end = _parse_range_header(range_header, file_size)
                except ValueError:
                    response = HttpResponse(status=416)
                    response['Content-Range'] = f'bytes */{file_size}'
                    return _apply_document_proxy_headers(response)

                response = StreamingHttpResponse(
                    _file_range_iterator(document_path, start, end),
                    status=206,
                    content_type='application/x-pdf-viewer'
                )
                _apply_document_proxy_headers(
                    response,
                    content_length=end - start + 1,
                    content_range=f'bytes {start}-{end}/{file_size}'
                )
                return response

            response = FileResponse(open(document_path, 'rb'), content_type='application/x-pdf-viewer')
            _apply_document_proxy_headers(response, content_length=file_size)
            return response
    except Exception as e:
        logger.error(f"Erreur proxy_document: {str(e)}")
        return Response({'error': f'Erreur de lecture: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
