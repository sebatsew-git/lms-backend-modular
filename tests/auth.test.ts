import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateFamilyId,
} from '../src/common/utils/jwt.util';
import { ROLE_PERMISSIONS } from '../src/common/constants/permissions';

describe('jwt utilities', () => {
  it('round-trips an access token payload', () => {
    const payload = { userId: 'user-1', role: 'STUDENT', permissions: ['course:read'] };
    const token = signAccessToken(payload);

    expect(verifyAccessToken(token)).toMatchObject(payload);
  });

  it('round-trips a refresh token with its family', () => {
    const family = generateFamilyId();
    const token = signRefreshToken('user-1', family);

    expect(verifyRefreshToken(token)).toEqual({ userId: 'user-1', family, iat: expect.any(Number), exp: expect.any(Number) });
  });

  it('hashes tokens deterministically', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
    expect(hashToken('abc')).toHaveLength(64);
  });
});

describe('permission matrix', () => {
  it('grants instructors grading rights but not user administration', () => {
    expect(ROLE_PERMISSIONS.INSTRUCTOR).toContain('submission:grade');
    expect(ROLE_PERMISSIONS.INSTRUCTOR).not.toContain('user:write');
  });

  it('keeps students read-only apart from submission and attempt creation', () => {
    expect(ROLE_PERMISSIONS.STUDENT).toContain('submission:create');
    expect(ROLE_PERMISSIONS.STUDENT).toContain('quiz:attempt');
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain('submission:grade');
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain('course:write');
  });

  it('gives admins the full set', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toContain('user:write');
    expect(ROLE_PERMISSIONS.ADMIN).toContain('quiz:write');
    expect(ROLE_PERMISSIONS.ADMIN.length).toBeGreaterThan(ROLE_PERMISSIONS.INSTRUCTOR.length);
  });
});
