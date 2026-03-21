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
});
