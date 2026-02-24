interface CacheEnvelope<T> {
  expiresAt: number
  createdAt: number
  value: T
}

interface FetchCacheOptions {
  ttlMs: number
  cacheKey?: string
  forceRefresh?: boolean
  allowStaleOnError?: boolean
  headers?: HeadersInit
}

const CACHE_PREFIX = 'rijal:cache:'
const memoryCache = new Map<string, CacheEnvelope<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

function makeKey(url: string, cacheKey?: string): string {
  return `${CACHE_PREFIX}${cacheKey ?? url}`
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readEnvelope<T>(key: string): CacheEnvelope<T> | null {
  const memoryValue = memoryCache.get(key) as CacheEnvelope<T> | undefined
  if (memoryValue) {
    return memoryValue
  }

  if (!canUseStorage()) {
    return null
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.expiresAt !== 'number' ||
      typeof parsed.createdAt !== 'number' ||
      !('value' in parsed)
    ) {
      window.localStorage.removeItem(key)
      return null
    }

    memoryCache.set(key, parsed)
    return parsed
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

function writeEnvelope<T>(key: string, value: T, ttlMs: number): void {
  const envelope: CacheEnvelope<T> = {
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    value,
  }

  memoryCache.set(key, envelope)

  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // localStorage may be blocked or full; memory cache still works for this session.
  }
}

function isFresh(envelope: CacheEnvelope<unknown>): boolean {
  return envelope.expiresAt > Date.now()
}

async function fetchWithCache<T>(
  url: string,
  fetcher: () => Promise<T>,
  options: FetchCacheOptions,
): Promise<T> {
  const key = makeKey(url, options.cacheKey)
  const cached = readEnvelope<T>(key)

  if (!options.forceRefresh && cached && isFresh(cached)) {
    return cached.value
  }

  if (!options.forceRefresh && inFlight.has(key)) {
    return (await inFlight.get(key)) as T
  }

  const request = fetcher()
    .then((value) => {
      writeEnvelope(key, value, options.ttlMs)
      return value
    })
    .catch((error: unknown) => {
      if (options.allowStaleOnError !== false && cached) {
        return cached.value
      }

      throw error
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, request as Promise<unknown>)
  return request
}

export async function fetchJsonWithCache<T>(url: string, options: FetchCacheOptions): Promise<T> {
  return fetchWithCache<T>(
    url,
    async () => {
      const response = await fetch(url, {
        headers: options.headers,
      })

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
      }

      return (await response.json()) as T
    },
    options,
  )
}

export async function fetchTextWithCache(url: string, options: FetchCacheOptions): Promise<string> {
  return fetchWithCache<string>(
    url,
    async () => {
      const response = await fetch(url, {
        headers: options.headers,
      })

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
      }

      return response.text()
    },
    options,
  )
}
