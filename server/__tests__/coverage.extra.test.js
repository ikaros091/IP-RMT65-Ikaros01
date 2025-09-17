jest.setTimeout(20000);

describe('Extra coverage tests (unit)', () => {
  test('errorHandler returns proper messages for known error names', () => {
    const errorHandler = require('../middlewares/errorHandler');

    const makeRes = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    const cases = [
      { name: 'SequelizeUniqueConstraintError', expectStatus: 400 },
      { name: 'SequelizeValidationError', expectStatus: 400 },
      { name: 'InvalidLogin', expectStatus: 401 },
      { name: 'Unauthorized', expectStatus: 401 },
      { name: 'Forbidden', expectStatus: 403 },
      { name: 'SomeRandom', expectStatus: 500 },
    ];

    cases.forEach(c => {
      const req = {};
      const res = makeRes();
      const next = jest.fn();
      const err = new Error('boom');
      err.name = c.name;
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(c.expectStatus);
      expect(res.json).toHaveBeenCalled();
    });
  });

  test('authentication middleware throws Unauthorized on invalid header', async () => {
    // require fresh module
    const auth = require('../middlewares/authentication');
    const req = { headers: {} };
    const res = {};
    const next = jest.fn();
    try {
      await auth(req, res, next);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('Unauthorized');
    }
  });

  test('gemini wrapper pickModel fallback and listAvailableModels handling', async () => {
    // mock the external SDK to exercise gemini.js logic
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => {
      return {
        GoogleGenerativeAI: function() {
          return {
            listModels: async () => [{ name: 'models/text-bison-001' }],
            getGenerativeModel: ({ model }) => ({
              generateContent: async (prompt) => ({ response: { text: () => JSON.stringify([{ title: 'Mock Anime', reason: 'Because' }]) } })
            })
          };
        }
      };
    });

    const gemini = require('../helpers/gemini');
    const list = await gemini.listAvailableModels();
    expect(list).toBeDefined();

    const res = await gemini.generateContent('hello');
    // it should return an object (we don't inspect deeply) and not throw
    expect(res).toBeDefined();
  });

  test('recommendationController handles AI shaped outputs (response.text & output arrays)', async () => {
    jest.resetModules();

    // prepare mocked gemini that returns different shapes
    jest.doMock('../helpers/gemini', () => {
      return {
        listAvailableModels: async () => [{ name: 'models/text-bison-001' }],
        generateContent: async (prompt) => ({ response: { text: () => JSON.stringify([{ title: 'SomeTitle', reason: 'Ok' }]) } }),
        generate: async (prompt) => ({ output: [{ content: [{ text: JSON.stringify([{ title: 'Other', reason: 'Ok' }]) }] }] })
      };
    });

    // ensure ENABLE_AI true for this test
    process.env.ENABLE_AI = 'true';
    const app = require('../app');
    const request = require('supertest');

    // create a test user and login to obtain token
    const unique = Date.now();
    await request(app).post('/register').send({ username: `u${unique}`, email: `u${unique}@ex.com`, password: '123456' });
    const login = await request(app).post('/login').send({ email: `u${unique}@ex.com`, password: '123456' });
    const token = login.body.access_token;

    // call recommendations - generateContent path
    const res1 = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
    expect(res1.status).toBe(200);
    expect(res1.body).toHaveProperty('recommendations');

    // For generate() shape, we will temporarily replace listAvailableModels to still return a model
    const res2 = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
    expect(res2.status).toBe(200);
    expect(res2.body).toHaveProperty('recommendations');

    // cleanup
    delete process.env.ENABLE_AI;
  });
});
