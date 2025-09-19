const request = require('supertest');
const app = require('../app');
const { sequelize, User, Anime, MyList } = require('../models');

// Note: these tests assume you ran migrations and seeders for the test DB
// e.g. npx sequelize db:migrate --env test && npx sequelize db:seed:all --env test

let token;
let createdMyListId;
let testAnimeId;
const uniqueSuffix = Date.now();
const uniqueEmail = `jest-${uniqueSuffix}@example.com`;
const uniqueUsername = `jestuser-${uniqueSuffix}`;
const password = 'abcdef';

beforeAll(async () => {
  // ensure the DB is ready
  await sequelize.sync();

  // find a seeded anime to use
  const anime = await Anime.findOne();
  if (anime) testAnimeId = anime.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth: register & login', () => {
  test('Positive: register with valid data returns 201 and user data', async () => {
    const res = await request(app).post('/register').send({
      username: uniqueUsername,
      email: uniqueEmail,
      password,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', uniqueUsername);
    expect(res.body).toHaveProperty('email', uniqueEmail);
  });

  test('Negative: register with existing email returns 400', async () => {
    const res = await request(app).post('/register').send({
      username: `${uniqueUsername}-2`,
      email: uniqueEmail,
      password,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('Positive: login with created user returns token', async () => {
    const res = await request(app).post('/login').send({
      email: uniqueEmail,
      password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    token = res.body.access_token;
  });

  test('Negative: login with wrong password returns 401', async () => {
    const res = await request(app).post('/login').send({
      email: uniqueEmail,
      password: 'wrong',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Anime endpoints', () => {
  test('Positive: GET /animes returns paginated list', async () => {
    const res = await request(app).get('/animes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('Positive: GET /animes/:id returns anime when exists (if seeded)', async () => {
    if (!testAnimeId) return;
    const res = await request(app).get(`/animes/${testAnimeId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', testAnimeId);
    expect(res.body).toHaveProperty('title');
  });

  test('Negative: GET /animes/:id returns 404 when not found', async () => {
    const res = await request(app).get('/animes/9999999');
    expect(res.status).toBe(404);
  });
});

describe('MyList endpoints (requires auth)', () => {
  test('Negative: POST /mylist without token returns 401', async () => {
    const res = await request(app).post('/mylist').send({ anime_id: testAnimeId || 1 });
    expect(res.status).toBe(401);
  });

  test('Positive: POST /mylist with valid token creates entry', async () => {
    const res = await request(app)
      .post('/mylist')
      .set('Authorization', `Bearer ${token}`)
      .send({ anime_id: testAnimeId || 1 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdMyListId = res.body.id;
  });

  test('Positive: GET /mylist returns user lists', async () => {
    const res = await request(app).get('/mylist').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Positive: GET /mylist/:id returns item by id', async () => {
    if (!createdMyListId) return;
    const res = await request(app).get(`/mylist/${createdMyListId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', createdMyListId);
  });

  test('Negative: GET /mylist/:id for other user returns 404', async () => {
    const res = await request(app).get('/mylist/9999999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('Positive: PUT /mylist/:id updates progress and status', async () => {
    if (!createdMyListId) return;
    const res = await request(app)
      .put(`/mylist/${createdMyListId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress', 5);
  });

  test('Positive: DELETE /mylist/:id deletes the item', async () => {
    if (!createdMyListId) return;
    const res = await request(app).delete(`/mylist/${createdMyListId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Recommendations endpoint', () => {
  test('Positive: GET /recommendations returns fallback recommendations when AI disabled', async () => {
    const res = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendations');
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });
});
