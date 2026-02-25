import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchJsonWithCache, fetchTextWithCache } from './fetchCache'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeJsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response
}

function makeTextResponse(text: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
    json: () => Promise.resolve({}),
  } as Response
}

// Generate a unique key per test to avoid cross-test memory-cache collisions
let testCounter = 0
function uniqueKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${++testCounter}`
}

describe('fetchJsonWithCache', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('fetches and returns JSON data', async () => {
    mockFetch.mockResolvedValue(makeJsonResponse({ hello: 'world' }))

    const result = await fetchJsonWithCache<{ hello: string }>('https://example.com/api', {
      ttlMs: 60_000,
      cacheKey: uniqueKey('json-fetch'),
    })

    expect(result).toEqual({ hello: 'world' })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('returns cached value on subsequent call within TTL', async () => {
    const cacheKey = uniqueKey('json-cached')
    mockFetch.mockResolvedValue(makeJsonResponse({ count: 1 }))

    await fetchJsonWithCache('https://example.com/api', { ttlMs: 60_000, cacheKey })
    const result = await fetchJsonWithCache('https://example.com/api', { ttlMs: 60_000, cacheKey })

    expect(result).toEqual({ count: 1 })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('reads fresh data from localStorage when memory cache is empty', async () => {
    const cacheKey = uniqueKey('json-ls')
    const storageKey = `rijal:cache:${cacheKey}`
    const envelope = {
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      value: { fromStorage: true },
    }
    localStorage.setItem(storageKey, JSON.stringify(envelope))

    const result = await fetchJsonWithCache<{ fromStorage: boolean }>('https://example.com/api', {
      ttlMs: 60_000,
      cacheKey,
    })

    expect(result).toEqual({ fromStorage: true })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('ignores stale localStorage data and re-fetches', async () => {
    const cacheKey = uniqueKey('json-ls-stale')
    const storageKey = `rijal:cache:${cacheKey}`
    const staleEnvelope = {
      createdAt: Date.now() - 120_000,
      expiresAt: Date.now() - 60_000, // expired
      value: { stale: true },
    }
    localStorage.setItem(storageKey, JSON.stringify(staleEnvelope))

    mockFetch.mockResolvedValue(makeJsonResponse({ fresh: true }))
    const result = await fetchJsonWithCache('https://example.com/api', {
      ttlMs: 60_000,
      cacheKey,
    })

    expect(result).toEqual({ fresh: true })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('rejects malformed localStorage data and re-fetches', async () => {
    const cacheKey = uniqueKey('json-ls-corrupt')
    const storageKey = `rijal:cache:${cacheKey}`
    localStorage.setItem(storageKey, 'NOT_VALID_JSON{{{')

    mockFetch.mockResolvedValue(makeJsonResponse({ ok: true }))
    const result = await fetchJsonWithCache('https://example.com/api', {
      ttlMs: 60_000,
      cacheKey,
    })

    expect(result).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('rejects localStorage data missing required fields', async () => {
    const cacheKey = uniqueKey('json-ls-invalid')
    const storageKey = `rijal:cache:${cacheKey}`
    localStorage.setItem(storageKey, JSON.stringify({ wrong: 'shape' }))

    mockFetch.mockResolvedValue(makeJsonResponse({ fixed: true }))
    const result = await fetchJsonWithCache('https://example.com/api', {
      ttlMs: 60_000,
      cacheKey,
    })

    expect(result).toEqual({ fixed: true })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('throws on HTTP error status', async () => {
    mockFetch.mockResolvedValue(makeJsonResponse(null, 404))

    await expect(
      fetchJsonWithCache('https://example.com/notfound', {
        ttlMs: 60_000,
        cacheKey: uniqueKey('json-404'),
      }),
    ).rejects.toThrow('Request failed (404)')
  })

  it('throws on 500 HTTP error status', async () => {
    mockFetch.mockResolvedValue(makeJsonResponse(null, 500))

    await expect(
      fetchJsonWithCache('https://example.com/error', {
        ttlMs: 60_000,
        cacheKey: uniqueKey('json-500'),
      }),
    ).rejects.toThrow('Request failed (500)')
  })

  it('returns stale value on network error when allowStaleOnError is not false', async () => {
    const cacheKey = uniqueKey('json-stale-fallback')
    const storageKey = `rijal:cache:${cacheKey}`
    const staleEnvelope = {
      createdAt: Date.now() - 120_000,
      expiresAt: Date.now() - 10, // expired
      value: { stale: 'data' },
    }
    localStorage.setItem(storageKey, JSON.stringify(staleEnvelope))

    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await fetchJsonWithCache('https://example.com/api', {
      ttlMs: 60_000,
      cacheKey,
      allowStaleOnError: true,
    })

    expect(result).toEqual({ stale: 'data' })
  })

  it('throws on network error when allowStaleOnError is false and no cache', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(
      fetchJsonWithCache('https://example.com/api', {
        ttlMs: 60_000,
        cacheKey: uniqueKey('json-throw'),
        allowStaleOnError: false,
      }),
    ).rejects.toThrow('Network error')
  })

  it('throws on network error when allowStaleOnError is false even with stale cache', async () => {
    const cacheKey = uniqueKey('json-throw-stale')
    const storageKey = `rijal:cache:${cacheKey}`
    const staleEnvelope = {
      createdAt: Date.now() - 120_000,
      expiresAt: Date.now() - 10,
      value: { stale: true },
    }
    localStorage.setItem(storageKey, JSON.stringify(staleEnvelope))

    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(
      fetchJsonWithCache('https://example.com/api', {
        ttlMs: 60_000,
        cacheKey,
        allowStaleOnError: false,
      }),
    ).rejects.toThrow('Network error')
  })

  it('deduplicates concurrent in-flight requests', async () => {
    const cacheKey = uniqueKey('json-inflight')
    let resolve!: (value: Response) => void
    const pending = new Promise<Response>((r) => {
      resolve = r
    })

    mockFetch.mockReturnValueOnce(pending)

    const p1 = fetchJsonWithCache('https://example.com/api', { ttlMs: 60_000, cacheKey })
    const p2 = fetchJsonWithCache('https://example.com/api', { ttlMs: 60_000, cacheKey })

    resolve(makeJsonResponse({ shared: true }))

    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1).toEqual({ shared: true })
    expect(r2).toEqual({ shared: true })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('forces refresh when forceRefresh is true', async () => {
    const cacheKey = uniqueKey('json-force-refresh')
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ version: 1 }))
    await fetchJsonWithCache('https://example.com/api', { ttlMs: 60_000, cacheKey })

    mockFetch.mockResolvedValueOnce(makeJsonResponse({ version: 2 }))
    const result = await fetchJsonWithCache('https://example.com/api', {
      ttlMs: 60_000,
      cacheKey,
      forceRefresh: true,
    })

    expect(result).toEqual({ version: 2 })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('sends custom headers with fetch request', async () => {
    mockFetch.mockResolvedValue(makeJsonResponse({ ok: true }))

    await fetchJsonWithCache('https://example.com/api', {
      ttlMs: 60_000,
      cacheKey: uniqueKey('json-headers'),
      headers: { Authorization: 'Bearer test-token', Accept: 'application/json' },
    })

    expect(mockFetch).toHaveBeenCalledWith('https://example.com/api', {
      headers: { Authorization: 'Bearer test-token', Accept: 'application/json' },
    })
  })

  it('uses url as cache key when no cacheKey provided', async () => {
    const url = `https://example.com/api/${uniqueKey('no-cache-key')}`
    mockFetch.mockResolvedValue(makeJsonResponse({ data: 'from-url-key' }))

    await fetchJsonWithCache(url, { ttlMs: 60_000 })
    const result = await fetchJsonWithCache(url, { ttlMs: 60_000 })

    expect(result).toEqual({ data: 'from-url-key' })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('writes value to localStorage after successful fetch', async () => {
    const cacheKey = uniqueKey('json-write-ls')
    const storageKey = `rijal:cache:${cacheKey}`
    mockFetch.mockResolvedValue(makeJsonResponse({ stored: true }))

    await fetchJsonWithCache('https://example.com/api', { ttlMs: 60_000, cacheKey })

    const raw = localStorage.getItem(storageKey)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.value).toEqual({ stored: true })
    expect(typeof parsed.expiresAt).toBe('number')
    expect(typeof parsed.createdAt).toBe('number')
  })
})

describe('fetchTextWithCache', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('fetches and returns text data', async () => {
    mockFetch.mockResolvedValue(makeTextResponse('<html>Hello</html>'))

    const result = await fetchTextWithCache('https://example.com/page', {
      ttlMs: 60_000,
      cacheKey: uniqueKey('text-fetch'),
    })

    expect(result).toBe('<html>Hello</html>')
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('throws on HTTP error for text fetch', async () => {
    mockFetch.mockResolvedValue(makeTextResponse('Not Found', 404))

    await expect(
      fetchTextWithCache('https://example.com/missing', {
        ttlMs: 60_000,
        cacheKey: uniqueKey('text-404'),
      }),
    ).rejects.toThrow('Request failed (404)')
  })

  it('returns cached text on subsequent call within TTL', async () => {
    const cacheKey = uniqueKey('text-cached')
    mockFetch.mockResolvedValue(makeTextResponse('cached content'))

    await fetchTextWithCache('https://example.com/page', { ttlMs: 60_000, cacheKey })
    const result = await fetchTextWithCache('https://example.com/page', { ttlMs: 60_000, cacheKey })

    expect(result).toBe('cached content')
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('falls back to stale text on error when allowStaleOnError is true', async () => {
    const cacheKey = uniqueKey('text-stale-fallback')
    const storageKey = `rijal:cache:${cacheKey}`
    const staleEnvelope = {
      createdAt: Date.now() - 120_000,
      expiresAt: Date.now() - 10,
      value: 'stale text content',
    }
    localStorage.setItem(storageKey, JSON.stringify(staleEnvelope))

    mockFetch.mockRejectedValue(new Error('Network down'))

    const result = await fetchTextWithCache('https://example.com/page', {
      ttlMs: 60_000,
      cacheKey,
      allowStaleOnError: true,
    })

    expect(result).toBe('stale text content')
  })

  it('sends custom headers for text fetch', async () => {
    mockFetch.mockResolvedValue(makeTextResponse('OK'))

    await fetchTextWithCache('https://example.com/page', {
      ttlMs: 60_000,
      cacheKey: uniqueKey('text-headers'),
      headers: { Accept: 'text/html' },
    })

    expect(mockFetch).toHaveBeenCalledWith('https://example.com/page', {
      headers: { Accept: 'text/html' },
    })
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})
