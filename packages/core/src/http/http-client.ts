export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface HttpRequestOptions {
  method?: HttpMethod;
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
  headers: Record<string, string>;
}

export type RequestHook = (req: HttpRequest) => HttpRequest | Promise<HttpRequest>;

export interface HttpErrorOptions {
  status: number;
  responseText?: string;
  request: HttpRequest;
}

export class HttpError extends Error {
  readonly status: number;
  readonly responseText?: string;
  readonly request: HttpRequest;

  constructor(message: string, opts: HttpErrorOptions) {
    super(message);
    this.name = 'HttpError';
    this.status = opts.status;
    if (opts.responseText !== undefined) this.responseText = opts.responseText;
    this.request = opts.request;
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  hooks?: RequestHook[];
  fetch?: typeof fetch;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryDelayMs: number;
  private readonly hooks: RequestHook[];
  private readonly fetchImpl: typeof fetch;

  constructor(opts: HttpClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.defaultHeaders = { 'content-type': 'application/json', ...opts.headers };
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.retries = opts.retries ?? 0;
    this.retryDelayMs = opts.retryDelayMs ?? 500;
    this.hooks = opts.hooks ?? [];
    this.fetchImpl = opts.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
    const method = options.method ?? 'GET';
    const queryString = this.serializeQuery(options.query);
    const url = `${this.baseUrl}${options.path}${queryString}`;
    const signal = AbortSignal.timeout(options.timeoutMs ?? this.timeoutMs);

    let req: HttpRequest = {
      method,
      url,
      headers: { ...this.defaultHeaders, ...options.headers },
      body: options.body,
    };

    for (const hook of this.hooks) {
      req = await hook(req);
    }

    const retries = options.retries ?? this.retries;
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.dispatch<T>(req, signal);
      } catch (err) {
        if (attempt < retries && this.isRetryable(err)) {
          await delay(this.retryDelayMs * 2 ** attempt);
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  private async dispatch<T>(req: HttpRequest, signal: AbortSignal): Promise<HttpResponse<T>> {
    const { method, url, headers, body } = req;
    const payload =
      body === undefined
        ? undefined
        : typeof body === 'string'
          ? body
          : JSON.stringify(body);

    const response = await this.fetchImpl(url, {
      method,
      headers,
      ...(payload !== undefined ? { body: payload } : {}),
      ...(signal ? { signal } : {}),
    });

    const responseText = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let data: unknown;
    if (responseText.length > 0) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }
    }

    if (!response.ok) {
      throw new HttpError(`HTTP ${response.status} for ${method} ${url}`, {
        status: response.status,
        responseText,
        request: req,
      });
    }

    return {
      status: response.status,
      ok: true,
      data: data as T,
      headers: responseHeaders,
    };
  }

  get<T>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'path'>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'GET', path });
  }

  post<T>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'path'>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'POST', path });
  }

  put<T>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'path'>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'PUT', path });
  }

  patch<T>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'path'>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'PATCH', path });
  }

  delete<T>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'path'>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, method: 'DELETE', path });
  }

  private isRetryable(err: unknown): boolean {
    if (err instanceof HttpError) {
      return err.status >= 500 || err.status === 429;
    }
    return true;
  }

  private serializeQuery(query?: Record<string, unknown>): string {
    if (!query) return '';
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      params.set(key, String(value));
    }
    const str = params.toString();
    return str ? `?${str}` : '';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}