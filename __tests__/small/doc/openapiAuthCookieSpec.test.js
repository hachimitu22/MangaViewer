const fs = require('fs');
const path = require('path');

describe('OpenAPI 認証Cookie名の整合性', () => {
  const read = relativePath => fs.readFileSync(path.resolve(__dirname, '../../../', relativePath), 'utf8');

  test('securitySchemes.cookieAuth.name は session_token である', () => {
    const openapi = read('doc/5_api/openapi/openapi.yaml');

    expect(openapi).toMatch(/securitySchemes:\n\s+cookieAuth:\n\s+type: apiKey\n\s+in: cookie\n\s+name: session_token/);
    expect(openapi).not.toContain('name: sessionId');
  });

  test('認証関連パスの説明文が session_token Cookie で統一されている', () => {
    const login = read('doc/5_api/openapi/paths/api/login.yaml');
    const logout = read('doc/5_api/openapi/paths/api/logout.yaml');
    const openapi = read('doc/5_api/openapi/openapi.yaml');

    expect(login).toContain('description: ログイン成功時に session_token Cookie を発行する。');
    expect(login).toContain('description: session_token Cookie');
    expect(logout).toContain('description: session_token Cookie による認証済みセッションを破棄する。');
    expect(openapi).toContain('description: session_token Cookie が無効、または未送信');
  });
});
