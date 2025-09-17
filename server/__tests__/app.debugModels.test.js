jest.resetModules();
const request = require('supertest');

describe('/debug/models route', () => {
  beforeEach(() => jest.resetModules());

  test('returns models when gemini.listAvailableModels succeeds', async () => {
    jest.doMock('../helpers/gemini', () => ({ listAvailableModels: async () => [{ name: 'a' }] }));
    // bypass authentication middleware for this test
    jest.doMock('../middlewares/authentication', () => (req, res, next) => next());
    const app = require('../app');
    const res = await request(app).get('/debug/models');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('models');
    expect(Array.isArray(res.body.models)).toBe(true);
  });

  test('returns 500 when gemini.listAvailableModels throws', async () => {
  jest.doMock('../helpers/gemini', () => ({ listAvailableModels: async () => { throw new Error('boom'); } }));
  // bypass authentication middleware for this test
  jest.doMock('../middlewares/authentication', () => (req, res, next) => next());
  const app = require('../app');
    const res = await request(app).get('/debug/models');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
