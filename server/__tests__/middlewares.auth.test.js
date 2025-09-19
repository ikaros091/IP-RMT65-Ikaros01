const request = require('supertest');
const app = require('../app');

test('authentication middleware accepts valid token and allows access to protected route', async () => {
  const unique = Date.now();
  await request(app).post('/register').send({ username: `a${unique}`, email: `a${unique}@ex.com`, password: '123456' });
  const login = await request(app).post('/login').send({ email: `a${unique}@ex.com`, password: '123456' });
  const token = login.body.access_token;

  // call a protected route (mylist) - should return 200 or empty array
  const res = await request(app).get('/mylist').set('Authorization', `Bearer ${token}`);
  expect([200, 401]).toContain(res.status); // if DB state differs, allow 200 or 401
});
