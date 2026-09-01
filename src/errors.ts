export class OpenSellvyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'OpenSellvyError';
  }
}

export class PlatformNotFoundError extends OpenSellvyError {
  constructor(platform: string) {
    super('PLATFORM_NOT_FOUND', `Platform "${platform}" not registered`, { platform });
  }
}

export class AuthError extends OpenSellvyError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message);
  }
}

export class ConnectorError extends OpenSellvyError {
  constructor(
    platform: string,
    message: string,
    public readonly upstream?: Record<string, unknown>,
  ) {
    super('CONNECTOR_ERROR', message, { platform, upstream });
  }
}

export class ValidationError extends OpenSellvyError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message);
  }
}
