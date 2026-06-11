// Platform adapter seam. Web implementations now; Capacitor (Preferences,
// Haptics) and Tauri swap in behind these same interfaces later.

export interface KVStorage {
  get(key: string): string | null
  set(key: string, value: string): void
}

class LocalStorageKV implements KVStorage {
  get(key: string): string | null {
    try { return localStorage.getItem(key) } catch { return null }
  }
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value) } catch { /* private mode etc. */ }
  }
}

export const storage: KVStorage = new LocalStorageKV()

export function loadJSON<T>(key: string, fallback: T): T {
  const raw = storage.get(key)
  if (raw === null) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

export function saveJSON(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value))
}

/** Haptics seam — navigator.vibrate on web/Android; Capacitor Haptics later
 *  (iOS WKWebView has no navigator.vibrate). */
export function vibrate(pattern: number | number[]): void {
  try { navigator.vibrate?.(pattern) } catch { /* unsupported */ }
}
