jest.setTimeout(20000);

describe('gemini fallback loop and candidate probing', () => {
  test('getGenerativeModel throws for early candidates and succeeds for later candidate', async () => {
    jest.resetModules();
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: function() {
        return {
          // no listModels to force fallback loop
          getGenerativeModel: ({ model }) => {
            if (model === 'models/text-bison-001' || model === 'models/chat-bison-001') {
              throw new Error('not available');
            }
            // succeed for later candidate
            return { generateContent: async (p) => ({ response: { text: () => JSON.stringify([{ title: 'FB', reason: 'ok' }]) } }) };
          }
        };
      }
    }));

    const gemini = require('../helpers/gemini');
    const out = await gemini.generateContent('ping');
    expect(out).toBeDefined();
    // verify it returns shape containing response
    expect(out.response).toBeDefined();
  });
});
