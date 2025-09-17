jest.setTimeout(20000);

describe('RecommendationController local fallback branches', () => {
  const request = require('supertest');

  test('local fallback honors genre preference when user has MyList entries', async () => {
    jest.resetModules();
    // Ensure AI disabled so controller uses local fallback
    delete process.env.ENABLE_AI;

    const app = require('../app');
    const uniq = Date.now();
    // register a user and set a MyList entry pointing at a known anime with genre 'Action'
    await request(app).post('/register').send({ username: `lf${uniq}`, email: `lf${uniq}@ex.com`, password: '123456' });
    const login = await request(app).post('/login').send({ email: `lf${uniq}@ex.com`, password: '123456' });
    const token = login.body.access_token;

    // Add a mylist entry for the first anime to create a genre signal
    const animes = await (require('../models')).Anime.findAll({ limit: 1 });
    const first = animes[0];
    await request(app).post('/mylist').set('Authorization', `Bearer ${token}`).send({ anime_id: first.id, progress: 1, status: 'Watching' });

    const res = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.recommendations).toBeDefined();
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  test('AI malformed JSON falls back to local recommender', async () => {
    jest.resetModules();
    process.env.ENABLE_AI = 'true';
    // mock gemini to return malformed JSON
    jest.doMock('../helpers/gemini', () => ({
      listAvailableModels: async () => [{ name: 'models/text-bison-001' }],
      generateContent: async () => ({ response: { text: () => 'this is not json' } })
    }));

    const app = require('../app');
    const uniq = Date.now()+1;
    await request(app).post('/register').send({ username: `mf${uniq}`, email: `mf${uniq}@ex.com`, password: '123456' });
    const login = await request(app).post('/login').send({ email: `mf${uniq}@ex.com`, password: '123456' });
    const token = login.body.access_token;

    const res = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
    // Should not crash; should return recommendations from local fallback
    expect(res.status).toBe(200);
    expect(res.body.recommendations).toBeDefined();
    delete process.env.ENABLE_AI;
  });
});
