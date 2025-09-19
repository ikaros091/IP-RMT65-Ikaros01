describe('global teardown', () => {
  afterAll(async () => {
    // close Sequelize connection to avoid Jest open handles
    const { sequelize } = require('../models');
    if (sequelize && typeof sequelize.close === 'function') {
      await sequelize.close();
    }
  });

  test('noop', () => {
    expect(true).toBe(true);
  });
});
