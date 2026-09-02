/**
 * ApiError — kesalahan HTTP-terstruktur untuk lapisan API.
 * Controller/use-case tetap throw Error biasa; errorHandler memetakan ke ApiError.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Petakan Error dari lapisan bawah ke ApiError dengan status HTTP yang masuk akal. */
  static from(err: unknown): ApiError {
    if (err instanceof ApiError) return err;
    const message = err instanceof Error ? err.message : String(err);
    if (/not found/i.test(message)) return new ApiError(404, 'NOT_FOUND', message);
    if (/tidak|harus|valid|required|kurang|invalid/i.test(message)) {
      return new ApiError(400, 'VALIDATION_ERROR', message);
    }
    if (/unauthorized|forbidden|token/i.test(message)) {
      return new ApiError(401, 'UNAUTHORIZED', message);
    }
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
