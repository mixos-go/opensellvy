import { describe, expect, it, vi } from 'vitest';
import { HttpClient, HttpError } from '../src/http/http-client';

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const resHeaders = new Headers();
    resHeaders.set('content-type', 'application/json');
    for (const [k, v] of Object.entries(headers)) resHeaders.set(k, v);
    return new Response(JSON.stringify(body), { status, headers: resHeaders });
  }) as unknown as typeof fetch;
}

describe('HttpClient', () => {
  it('serializes query + parses JSON', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    const client = new HttpClient({ baseUrl: 'https://api.example.com/', fetch: fetchMock });
    const res = await client.get<{ ok: boolean }>('/v1/x', { query: { a: 1, b: 'two', skip: undefined } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = (fetchMock.mock.calls[0] as unknown[])[0];
    expect(url).toBe('https://api.example.com/v1/x?a=1&b=two');
    expect(res.data).toEqual({ ok: true });
    expect(res.ok).toBe(true);
  });

  it('stringifies object body with JSON content-type', async () => {
    const fetchMock = mockFetch(200, { id: 1 });
    const client = new HttpClient({ baseUrl: 'https://api.example.com', fetch: fetchMock });
    await client.post('/v1/orders', { body: { id: 'o-1' } });
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.body).toBe('{"id":"o-1"}');
  });

  it('throws HttpError on non-2xx with response text', async () => {
    const fetchMock = vi.fn(async () => new Response('boom', { status: 400 }));
    const client = new HttpClient({ baseUrl: 'https://api.example.com', fetch: fetchMock });
    await expect(client.get('/x')).rejects.toBeInstanceOf(HttpError);
    await expect(client.get('/x')).rejects.toMatchObject({ status: 400, responseText: 'boom' });
  });

  it('runs request hooks before dispatch', async () => {
    const fetchMock = mockFetch(200, {});
    const seen: HttpRequestLike[] = [];
    const client = new HttpClient({
      baseUrl: 'https://api.example.com',
      fetch: fetchMock,
      hooks: [
        (req) => {
          seen.push(req);
          return { ...req, headers: { ...req.headers, authorization: 'Bearer abc' } };
        },
      ],
    });
    await client.get('/x');
    expect(seen).toHaveLength(1);
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer abc');
  });

  it('retries on 5xx with backoff', async () => {
    let calls = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls += 1;
      return calls < 3 ? new Response('err', { status: 500 }) : new Response('{"ok":true}', { status: 200 });
    }) as unknown as typeof fetch;
    const client = new HttpClient({ baseUrl: 'https://api.example.com', retries: 2, retryDelayMs: 1, fetch: fetchMock });
    const res = await client.get<{ ok: boolean }>('/x');
    expect(calls).toBe(3);
    expect(res.data).toEqual({ ok: true });
  });
});

interface HttpRequestLike {
  url: string;
  method: string;
  headers: Record<string, string>;
}
