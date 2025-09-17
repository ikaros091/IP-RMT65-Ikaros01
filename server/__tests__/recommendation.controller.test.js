jest.setTimeout(20000);

describe('RecommendationController AI shapes', () => {
  const request = require('supertest');

  test('handles response.text() shape from generateContent', async () => {
    jest.resetModules();
    process.env.ENABLE_AI = 'true';
    jest.doMock('../helpers/gemini', () => ({
      listAvailableModels: async () => [{ name: 'models/text-bison-001' }],
      generateContent: async () => ({ response: { text: () => JSON.stringify([{ title: 'RT1', reason: 'ok' }]) } })
    }));

    const app = require('../app');
    const uniq = Date.now();
    await request(app).post('/register').send({ username: `r${uniq}`, email: `r${uniq}@ex.com`, password: '123456' });
    const login = await request(app).post('/login').send({ email: `r${uniq}@ex.com`, password: '123456' });
    const token = login.body.access_token;

    const res = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendations');
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations[0].title).toBe('RT1');
    delete process.env.ENABLE_AI;
  });

  test('handles result.text() shape from generate', async () => {
    jest.resetModules();
    process.env.ENABLE_AI = 'true';
    jest.doMock('../helpers/gemini', () => ({
      listAvailableModels: async () => [{ name: 'models/chat-bison-001' }],
      generate: async () => ({ text: () => JSON.stringify([{ title: 'G2', reason: 'ok' }]) })
    }));

    const app = require('../app');
    const uniq = Date.now()+1;
    await request(app).post('/register').send({ username: `r${uniq}`, email: `r${uniq}@ex.com`, password: '123456' });
    const login = await request(app).post('/login').send({ email: `r${uniq}@ex.com`, password: '123456' });
    const token = login.body.access_token;

    const res = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.recommendations[0].title).toBe('G2');
    delete process.env.ENABLE_AI;
  });

  test('handles output[].content[].text shape', async () => {
    jest.resetModules();
    process.env.ENABLE_AI = 'true';
    jest.doMock('../helpers/gemini', () => ({
      listAvailableModels: async () => [{ name: 'models/text-bison-001' }],
      generate: async () => ({ output: [{ content: [{ text: JSON.stringify([{ title: 'O3', reason: 'ok' }]) }] }] })
    }));

    const app = require('../app');
    const uniq = Date.now()+2;
    await request(app).post('/register').send({ username: `r${uniq}`, email: `r${uniq}@ex.com`, password: '123456' });
    const login = await request(app).post('/login').send({ email: `r${uniq}@ex.com`, password: '123456' });
    const token = login.body.access_token;

    const res = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.recommendations[0].title).toBe('O3');
    delete process.env.ENABLE_AI;
  });

  test('handles plain string response from predict', async () => {
    jest.resetModules();
    process.env.ENABLE_AI = 'true';
    jest.doMock('../helpers/gemini', () => ({
      listAvailableModels: async () => [{ name: 'gemini-1' }],
      predict: async () => JSON.stringify([{ title: 'P4', reason: 'ok' }])
    }));

    const app = require('../app');
    const uniq = Date.now()+3;
    await request(app).post('/register').send({ username: `r${uniq}`, email: `r${uniq}@ex.com`, password: '123456' });
    const login = await request(app).post('/login').send({ email: `r${uniq}@ex.com`, password: '123456' });
    const token = login.body.access_token;

    const res = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.recommendations[0].title).toBe('P4');
    delete process.env.ENABLE_AI;
  });
});
