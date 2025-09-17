jest.resetModules();

describe('gemini listModels normalization (SDK shapes)', () => {
  beforeEach(() => jest.resetModules());

  test('listModels returns array shape', async () => {
    jest.doMock('@google/generative-ai', () => {
      return {
        GoogleGenerativeAI: function() {
          this.listModels = async () => [{ name: 'models/text-bison-001' }];
        }
      };
    });
    const gemini = require('../helpers/gemini');
    const res = await gemini.listAvailableModels();
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].name).toBe('models/text-bison-001');
  });

  test('listModels returns { models: [...] } shape', async () => {
    jest.doMock('@google/generative-ai', () => {
      return {
        GoogleGenerativeAI: function() {
          this.listModels = async () => ({ models: [{ id: 'm1' }] });
        }
      };
    });
    const gemini = require('../helpers/gemini');
    const res = await gemini.listAvailableModels();
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].id).toBe('m1');
  });

  test('listModels returns { model: [...] } shape', async () => {
    jest.doMock('@google/generative-ai', () => {
      return {
        GoogleGenerativeAI: function() {
          this.listModels = async () => ({ model: [{ id: 'mm' }] });
        }
      };
    });
    const gemini = require('../helpers/gemini');
    const res = await gemini.listAvailableModels();
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].id).toBe('mm');
  });

  test('listModels throwing returns error object', async () => {
    jest.doMock('@google/generative-ai', () => {
      return {
        GoogleGenerativeAI: function() {
          this.listModels = async () => { throw new Error('fail'); };
        }
      };
    });
    const gemini = require('../helpers/gemini');
    const res = await gemini.listAvailableModels();
    expect(res).toHaveProperty('error');
  });
});
