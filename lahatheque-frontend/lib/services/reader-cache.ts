/**
 * Service de cache IndexedDB pour les pages de liseuse rastérisées en local.
 * Permet un affichage instantané (0 ms) lors des réouvertures d'ouvrages déjà consultés.
 */

const DB_NAME = 'lahatheque_reader_db';
const DB_VERSION = 1;
const STORE_PAGES = 'rendered_pages';

interface CachedPageItem {
  key: string;
  bookId: string;
  lang: string;
  pageIndex: number;
  blob: Blob;
  width?: number;
  height?: number;
  timestamp: number;
}

class ReaderPageCacheService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private getDB(): Promise<IDBDatabase | null> {
    if (!this.isSupported()) return Promise.resolve(null);
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_PAGES)) {
            const store = db.createObjectStore(STORE_PAGES, { keyPath: 'key' });
            store.createIndex('bookId', 'bookId', { unique: false });
          }
        };

        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private buildKey(bookId: string, lang: string, pageIndex: number): string {
    const safeLang = lang || 'default';
    return `${bookId}:${safeLang}:${pageIndex}`;
  }

  /**
   * Récupère l'URL locale (Object URL) d'une page mise en cache si disponible.
   */
  async getPageBlobUrl(bookId: string, lang: string, pageIndex: number): Promise<string | null> {
    const db = await this.getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PAGES, 'readonly');
        const store = tx.objectStore(STORE_PAGES);
        const key = this.buildKey(bookId, lang, pageIndex);
        const request = store.get(key);

        request.onsuccess = () => {
          const item = request.result as CachedPageItem | undefined;
          if (item && item.blob) {
            try {
              const url = URL.createObjectURL(item.blob);
              resolve(url);
              return;
            } catch {
              resolve(null);
              return;
            }
          }
          resolve(null);
        };

        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Enregistre le blob d'une page rendue dans IndexedDB en arrière-plan.
   */
  async savePageBlob(
    bookId: string,
    lang: string,
    pageIndex: number,
    blob: Blob,
    width?: number,
    height?: number
  ): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PAGES, 'readwrite');
        const store = tx.objectStore(STORE_PAGES);
        const key = this.buildKey(bookId, lang, pageIndex);

        const item: CachedPageItem = {
          key,
          bookId,
          lang: lang || 'default',
          pageIndex,
          blob,
          width,
          height,
          timestamp: Date.now(),
        };

        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Efface le cache des pages pour un livre donné (ex: après mise à jour de fichier).
   */
  async clearBookCache(bookId: string): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PAGES, 'readwrite');
        const store = tx.objectStore(STORE_PAGES);
        const index = store.index('bookId');
        const request = index.openCursor(IDBKeyRange.only(bookId));

        request.onsuccess = (event: Event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export const readerPageCache = new ReaderPageCacheService();
