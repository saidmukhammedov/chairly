const getBaseUrl = (): string => {
  // In any non-localhost browser environment (chairly.uz, vercel.app, custom domains),
  // always use relative '/api' so requests go directly to our integrated serverless backend.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return '/api';
    }
  }
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && !envUrl.includes('onrender.com')) return envUrl;
  return 'http://localhost:4000/api';
};

const BASE_URL = getBaseUrl();

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

// In-memory cache for ultra-fast tab switches and page transitions
const cache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

// Default TTL: 30 seconds for read-only GET data
const DEFAULT_TTL_MS = 30_000;

export interface RequestOptions extends RequestInit {
  noCache?: boolean;
  ttl?: number;
}

export function clearApiCache(filterPrefix?: string) {
  if (!filterPrefix) {
    cache.clear();
  } else {
    for (const key of cache.keys()) {
      if (key.includes(filterPrefix)) {
        cache.delete(key);
      }
    }
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const token = typeof window !== 'undefined' ? localStorage.getItem('chairly_admin_token') : null;
  const isGet = method === 'GET';
  const cacheKey = `${token ? 'auth:' : 'pub:'}${endpoint}`;

  // 1. Invalidate cache on mutations
  if (!isGet) {
    clearApiCache();
  }

  // 2. Check in-memory cache for GET requests
  if (isGet && !options.noCache) {
    const cached = cache.get(cacheKey);
    const ttl = options.ttl ?? DEFAULT_TTL_MS;
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T;
    }

    // 3. Request deduplication: return existing in-flight promise if available
    const existingFlight = inFlightRequests.get(cacheKey);
    if (existingFlight) {
      return existingFlight as Promise<T>;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new ApiError(data.error || 'An unexpected error occurred', res.status, data.details);
      }

      // Store in memory cache
      if (isGet && !options.noCache) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      return data as T;
    } finally {
      if (isGet) {
        inFlightRequests.delete(cacheKey);
      }
    }
  })();

  if (isGet && !options.noCache) {
    inFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

export const api = {
  get: <T>(endpoint: string, options?: { noCache?: boolean; ttl?: number }) =>
    request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  clearCache: clearApiCache,
};

export default api;
