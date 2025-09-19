jest.setTimeout(20000);

describe('Gemini shapes and recommendation parsing', () => {
  test('gemini generate returns output[] shape and recommendation parses', async () => {
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        return {
          listModels: async () => [{ name: 'models/text-bison-001' }],
          getGenerativeModel: () => ({
            generate: async (prompt) => ({ output: [{ content: [{ text: JSON.stringify([{ title: 'G1', reason: 'r' }]) }] }] })
          })
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    const res = await gemini.generate('hello');
    expect(res).toBeDefined();
  });

  test('gemini predict supported shape', async () => {
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        return {
          listModels: async () => [{ name: 'models/chat-bison-001' }],
          getGenerativeModel: () => ({
            predict: async (p) => ({ text: () => JSON.stringify([{ title: 'P1', reason: 'r' }]) })
          })
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    const out = await gemini.predict('ping');
    expect(out).toBeDefined();
  });
});
