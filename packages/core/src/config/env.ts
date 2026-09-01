export type EnvSource = Record<string, string | undefined>;

export type EnvPrimitive = { type: 'value' } | { type: 'int' } | { type: 'bool' };

export function readEnv(source: EnvSource = process.env): EnvSource {
  return source;
}

export function getEnv(source: EnvSource, key: string): string | undefined {
  return source[key];
}

export function requireEnv(source: EnvSource, key: string): string {
  const value = source[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getInt(source: EnvSource, key: string, fallback?: number): number | undefined {
  const value = source[key];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function getBool(source: EnvSource, key: string, fallback?: boolean): boolean | undefined {
  const value = source[key];
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

export interface NamespaceSpec {
  appId: string;
  secret: string;
  redirectUri: string;
  sandbox?: string;
}

export function resolveNamespace(source: EnvSource, prefix: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(source)) {
    if (key.startsWith(`${prefix}_`)) {
      result[key.slice(prefix.length + 1).toLowerCase()] = source[key] as string;
    }
  }
  return result;
}