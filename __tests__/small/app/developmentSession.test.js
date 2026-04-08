const {
  hasDevelopmentSession,
  shouldApplyDevelopmentSession,
} = require('../../../src/app/developmentSession');

describe('developmentSession', () => {
  test('固定セッション設定が揃っていると有効と判定する', () => {
    expect(hasDevelopmentSession({
      devSessionToken: 'dev-token',
      devSessionUserId: 'admin-dev',
      devSessionTtlMs: 60_000,
    })).toBe(true);
  });

  test('devSessionToken が欠落している場合は固定セッションを無効と判定する', () => {
    expect(hasDevelopmentSession({
      devSessionUserId: 'admin-dev',
      devSessionTtlMs: 60_000,
    })).toBe(false);
  });

  test('devSessionUserId が欠落している場合は固定セッションを無効と判定する', () => {
    expect(hasDevelopmentSession({
      devSessionToken: 'dev-token',
      devSessionTtlMs: 60_000,
    })).toBe(false);
  });

  test.each([
    ['0', 0],
    ['負数', -1],
    ['非整数', 0.5],
  ])('devSessionTtlMs が %s の場合は固定セッションを無効と判定する', (_name, devSessionTtlMs) => {
    expect(hasDevelopmentSession({
      devSessionToken: 'dev-token',
      devSessionUserId: 'admin-dev',
      devSessionTtlMs,
    })).toBe(false);
  });

  test('対象パスのみ固定セッションを補完対象と判定する', () => {
    const env = {
      devSessionToken: 'dev-token',
      devSessionUserId: 'admin-dev',
      devSessionTtlMs: 60_000,
      devSessionPaths: ['/screen/entry', '/api/media'],
    };

    expect(shouldApplyDevelopmentSession({ env, requestPath: '/screen/entry' })).toBe(true);
    expect(shouldApplyDevelopmentSession({ env, requestPath: '/api/media' })).toBe(true);
    expect(shouldApplyDevelopmentSession({ env, requestPath: '/unknown' })).toBe(false);
  });

  test('固定セッションが無効な場合は対象パスでも補完対象にしない', () => {
    const env = {
      devSessionToken: '',
      devSessionUserId: 'admin-dev',
      devSessionTtlMs: 60_000,
      devSessionPaths: ['/screen/entry'],
    };

    expect(shouldApplyDevelopmentSession({ env, requestPath: '/screen/entry' })).toBe(false);
  });

  test('production 環境では固定セッション設定が揃っていても補完対象にしない', () => {
    const env = {
      nodeEnv: 'production',
      devSessionToken: 'dev-token',
      devSessionUserId: 'admin-dev',
      devSessionTtlMs: 60_000,
      devSessionPaths: ['/screen/entry'],
    };

    expect(hasDevelopmentSession(env)).toBe(false);
    expect(shouldApplyDevelopmentSession({ env, requestPath: '/screen/entry' })).toBe(false);
  });
});
