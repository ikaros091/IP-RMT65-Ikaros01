jest.setTimeout(20000);

describe('gemini chosen model without supported methods', () => {
  test('pickModel returns model object lacking generate/predict and wrapper throws', async () => {
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        return {
          listModels: async () => [{ name: 'models/text-bison-001' }],
          getGenerativeModel: ({ model }) => ({ /* empty model, no methods */ })
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    await expect(gemini.generateContent('x')).rejects.toThrow('No supported generate method on model');
  });
});
