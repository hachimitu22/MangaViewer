const { createEnv } = require('../../../src/app/createEnv');

describe('server.createEnv', () => {
  test('ハッシュ関連パラメータが未指定の場合に安全なデフォルトを設定する', () => {
    const env = createEnv({});

    expect(env.loginPasswordHashAlgorithm).toBe('bcrypt');
    expect(env.loginPasswordHashMemoryCost).toBe(65_536);
    expect(env.loginPasswordHashIterations).toBe(3);
    expect(env.loginPasswordHashParallelism).toBe(1);
    expect(env.loginPasswordHashTimeCost).toBe(3);
    expect(env.loginPasswordHashBcryptCost).toBe(12);
  });
});
