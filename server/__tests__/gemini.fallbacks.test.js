jest.setTimeout(20000);

describe('gemini fallbacks and errors', () => {
  test('listAvailableModels returns message when SDK has no listModels', async () => {
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        return {
          // no listModels implemented
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    const res = await gemini.listAvailableModels();
    expect(res).toBeDefined();
    expect(res).toHaveProperty('message');
  });

  test('generateContent throws when getGenerativeModel throws for all candidates', async () => {
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        return {
          getGenerativeModel: ({ model }) => { throw new Error('not available'); }
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    await expect(gemini.generateContent('x')).rejects.toThrow('No available generative model');
  });

  test('generateContent throws when chosen model lacks supported methods', async () => {
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        return {
          getGenerativeModel: () => ({})
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    await expect(gemini.generateContent('x')).rejects.toThrow('No supported generate method on model');
  });
});

describe('recommendation enrichment', () => {
  const request = require('supertest');
  test('AI result is enriched with image_url when title matches DB', async () => {
    jest.resetModules();
    process.env.ENABLE_AI = 'true';

    // create an anime in DB to match
      const { Anime } = require('../models');
      // pick an existing anime that will be included in controller's limited query
      const existing = await Anime.findOne();
      if (!existing) throw new Error('No anime in DB to use for enrichment test');
      const title = existing.title;
      const img = existing.image_url;

      // mock gemini to return that title
      jest.doMock('../helpers/gemini', () => ({
        listAvailableModels: async () => [{ name: 'models/text-bison-001' }],
        generateContent: async () => ({ response: { text: () => JSON.stringify([{ title, reason: 'match' }]) } })
      }));

      const app = require('../app');
      const uniq = Date.now();
    await request(app).post('/register').send({ username: `enr${uniq}`, email: `enr${uniq}@ex.com`, password: '123456' });
    const login = await request(app).post('/login').send({ email: `enr${uniq}@ex.com`, password: '123456' });
    const token = login.body.access_token;

    const res = await request(app).get('/recommendations').set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  // debug output
  // eslint-disable-next-line no-console
  console.log('RECOMMENDATIONS:', JSON.stringify(res.body.recommendations, null, 2));
  expect(res.body.recommendations[0]).toHaveProperty('image_url');
  expect(res.body.recommendations[0].image_url).toBe(img);

    delete process.env.ENABLE_AI;
  });
});
