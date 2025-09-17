const request = require('supertest');
const app = require('../app');

test('protected route without Authorization header returns 401', async () => {
  const res = await request(app).get('/mylist');
  expect(res.status).toBe(401);
  expect(res.body).toHaveProperty('message');
});

test('protected route with malformed Authorization returns 401', async () => {
  const res = await request(app).get('/mylist').set('Authorization', 'BadHeader token');
  expect(res.status).toBe(401);
  expect(res.body).toHaveProperty('message');
});
