const {
  BCRYPT_PBKDF_PREFIX,
  detectHashScheme,
  hashPassword,
  verifyPassword,
} = require('../../../../src/infrastructure/auth/fixedUserPasswordHasher');

describe('fixedUserPasswordHasher', () => {
  test('新方式ハッシュを生成して検証できる', () => {
    const passwordHash = hashPassword('secret', { bcryptCost: 4 });

    expect(passwordHash.startsWith(BCRYPT_PBKDF_PREFIX)).toBe(true);

    expect(verifyPassword({
      password: 'secret',
      passwordHash,
    })).toEqual({
      verified: true,
      scheme: 'bcrypt-pbkdf',
      needsRehash: false,
    });
  });

  test('旧SHA-256形式の判別と検証互換を提供する', () => {
    const legacySha256Hash = '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b';

    expect(detectHashScheme(legacySha256Hash)).toBe('legacy-sha256');
    expect(verifyPassword({
      password: 'secret',
      passwordHash: legacySha256Hash,
    })).toEqual({
      verified: true,
      scheme: 'legacy-sha256',
      needsRehash: true,
    });
  });

  test('不正パスワードは拒否される', () => {
    const passwordHash = hashPassword('secret', { bcryptCost: 4 });

    expect(verifyPassword({
      password: 'wrong',
      passwordHash,
    })).toEqual({
      verified: false,
      scheme: 'bcrypt-pbkdf',
      needsRehash: false,
    });
  });
});
