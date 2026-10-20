import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('app bootstrap', () => {
  it('GET /health reports ok and exposes queue stats', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.environment).toBe('test');
    expect(res.body.jobs).toHaveProperty('pending');
  });

  it('unknown routes return the structured 404 envelope', async () => {
    const res = await request(app).get('/api/v1/definitely-not-a-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('serves the generated OpenAPI document', async () => {
    const res = await request(app).get('/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.info.title).toBe('LMS API');
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    const res = await request(app).get('/api/v1/users');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
