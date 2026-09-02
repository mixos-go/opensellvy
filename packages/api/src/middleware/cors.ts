import type { MiddlewareHandler } from 'hono';

export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULTS: Required<CorsOptions> = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400,
};

/** CORS middleware Hono — menangani preflight OPTIONS dan header response. */
export function cors(options: CorsOptions = {}): MiddlewareHandler {
  const opts = { ...DEFAULTS, ...options };
  const allowed = Array.isArray(opts.origin) ? opts.origin : [opts.origin];

  return async (c, next) => {
    const origin = c.req.header('Origin') ?? '*';

    if (opts.origin === '*' && !opts.credentials) {
      c.header('Access-Control-Allow-Origin', '*');
    } else if (allowed.includes(origin) || allowed.includes('*')) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Vary', 'Origin');
    }

    if (opts.credentials) c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', opts.methods.join(', '));
    c.header('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
    c.header('Access-Control-Max-Age', String(opts.maxAge));

    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204);
    }
    await next();
  };
}
