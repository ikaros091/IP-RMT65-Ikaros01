jest.resetModules();

describe('gemini fallback when SDK lacks listModels and wrapper method orders', () => {
  beforeEach(() => jest.resetModules());

  test('listAvailableModels returns message when SDK has no listModels', async () => {
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        // intentionally no listModels function
        this.getGenerativeModel = () => ({ generateContent: async () => ({ text: 'ok' }) });
      }
    }));

    const gemini = require('../helpers/gemini');
    const res = await gemini.listAvailableModels();
    expect(res).toHaveProperty('message');
    expect(res.message).toMatch(/listModels not supported/);
  });

  test('fallback loop selects first working model and wrapper falls back to predict', async () => {
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        this.getGenerativeModel = ({ model }) => {
          // first two candidates throw, gemini-1 returns object with only predict
          if (model.includes('text-bison') || model.includes('chat-bison')) {
            throw new Error('not available');
          }
          if (model.includes('gemini-1')) {
            return {
              predict: async (prompt) => 'predicted:' + prompt
            };
          }
          return { generateContent: async () => ({ text: 'late' }) };
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    const out1 = await gemini.generateContent('X');
    // generateContent should fall through to predict when generateContent not present
    expect(out1).toBe('predicted:X');

    const out2 = await gemini.generate('Y');
    expect(out2).toBe('predicted:Y');

    const out3 = await gemini.predict('Z');
    expect(out3).toBe('predicted:Z');
  });
});
