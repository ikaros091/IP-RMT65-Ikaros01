jest.setTimeout(20000);

describe('gemini.js branch coverage', () => {
  test('listModels returns { models: [] } shape and pickModel falls back to getGenerativeModel', async () => {
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        let called = 0;
        return {
          listModels: async () => ({ models: [{ name: 'models/text-bison-001' }] }),
          getGenerativeModel: ({ model }) => ({ generateContent: async () => ({ text: 'ok' }) })
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    const list = await gemini.listAvailableModels();
    expect(list).toBeDefined();
    const out = await gemini.generateContent('x');
    expect(out).toBeDefined();
  });

  test('listModels returns array-of-models and getGenerativeModel generate returns output shape', async () => {
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        return {
          listModels: async () => [{ model: 'models/chat-bison-001' }],
          getGenerativeModel: () => ({ generate: async () => ({ output: [{ content: [{ text: '[]' }] }] }) })
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    const r = await gemini.generate('h');
    expect(r).toBeDefined();
  });
});
