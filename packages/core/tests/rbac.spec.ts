import { describe, expect, it } from 'vitest';
import { roleDefinitions } from '../src/auth/rbac/role';

describe('rbac roles', () => {
  it('has 5 role definitions with unique codes', () => {
    const codes = roleDefinitions.map((r) => r.code);
    expect(codes).toHaveLength(5);
    expect(new Set(codes).size).toBe(5);
  });

  it('owner has full permissions', () => {
    const owner = roleDefinitions.find((r) => r.code === 'owner');
    expect(owner?.permissions.length).toBeGreaterThan(10);
  });
});