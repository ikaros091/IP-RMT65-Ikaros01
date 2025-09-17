const { hashPassword, comparePassword } = require('../helpers/formatter');

describe('helpers/formatter', () => {
  test('hashPassword produces a hash and comparePassword validates it', () => {
    const pw = 'supersecret';
    const hashed = hashPassword(pw);
    expect(typeof hashed).toBe('string');
    const ok = comparePassword(pw, hashed);
    expect(ok).toBe(true);
    const notOk = comparePassword('wrong', hashed);
    expect(notOk).toBe(false);
  });
});
