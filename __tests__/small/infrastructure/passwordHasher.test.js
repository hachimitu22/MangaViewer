const {
  hashPassword,
  verifyPassword,
  detectHashScheme,
  sha256Hex,
} = require('../../../src/infrastructure/auth/passwordHasher');

describe('passwordHasher', () => {
  test('新方式ハッシュ文字列に方式識別子が含まれる', () => {
    const passwordHash = hashPassword('secret');

    expect(passwordHash.startsWith('$scrypt$')).toBe(true);
    expect(detectHashScheme(passwordHash)).toBe('scrypt');
  });

  test('新方式でハッシュ生成・検証できる', () => {
    const passwordHash = hashPassword('secret', {
      memoryCost: 32_768,
      iterations: 16_384,
      parallelism: 1,
      timeCost: 8,
    });

    expect(verifyPassword('secret', passwordHash)).toBe(true);
  });

  test('旧SHA-256形式を判別して検証できる', () => {
    const legacyHash = sha256Hex('secret');

    expect(detectHashScheme(legacyHash)).toBe('sha256');
    expect(verifyPassword('secret', legacyHash)).toBe(true);
    expect(verifyPassword('invalid', legacyHash)).toBe(false);
  });

  test('不正な方式は検証失敗になる', () => {
    expect(detectHashScheme('unknown$hash')).toBe('unknown');
    expect(verifyPassword('secret', 'unknown$hash')).toBe(false);
  });
});
