const request = require('supertest');
const app = require('../app');

describe('Controller index branches', () => {
  test('GET /animes with search and sort query returns 200', async () => {
    const res = await request(app).get('/animes').query({ search: 'a', sort: 'score', page: 1, limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  test('GET /animes/:id returns 404 for non-existent id', async () => {
    const res = await request(app).get('/animes/99999999');
    expect(res.status).toBe(404);
  });
});
