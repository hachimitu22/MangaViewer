const crypto = require('crypto');
const { pbkdf: bcryptPbkdf } = require('bcrypt-pbkdf');

const DEFAULT_BCRYPT_PBKDF_ROUNDS = 12;
const DEFAULT_BCRYPT_PBKDF_KEY_LENGTH = 32;
const BCRYPT_PBKDF_PREFIX = 'bcryptpbkdf$';
const SHA256_PREFIX = 'sha256$';
const LEGACY_SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

const isNonEmptyString = value => typeof value === 'string' && value.length > 0;

const sha256 = password => crypto.createHash('sha256').update(password).digest('hex');

const normalizeBcryptRounds = value => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_BCRYPT_PBKDF_ROUNDS;
  }
  return Math.max(4, Math.min(32, parsed));
};

const deriveBcryptPbkdf = ({ password, salt, rounds, keyLength }) => {
  const key = Buffer.alloc(keyLength);
  const result = bcryptPbkdf(
    Buffer.from(password, 'utf8'),
    Buffer.byteLength(password, 'utf8'),
    salt,
    salt.length,
    key,
    keyLength,
    rounds,
  );

  if (result !== 0) {
    throw new Error('failed to derive password hash');
  }

  return key;
};

const detectHashScheme = passwordHash => {
  if (!isNonEmptyString(passwordHash)) {
    return 'unknown';
  }

  if (passwordHash.startsWith(BCRYPT_PBKDF_PREFIX)) {
    return 'bcrypt-pbkdf';
  }

  if (passwordHash.startsWith(SHA256_PREFIX)) {
    return 'sha256';
  }

  if (LEGACY_SHA256_HEX_PATTERN.test(passwordHash)) {
    return 'legacy-sha256';
  }

  return 'unknown';
};

const hashPassword = (password, options = {}) => {
  if (!isNonEmptyString(password)) {
    throw new Error('password must be a non-empty string');
  }

  const rounds = normalizeBcryptRounds(options.bcryptCost);
  const keyLength = DEFAULT_BCRYPT_PBKDF_KEY_LENGTH;
  const salt = crypto.randomBytes(16);
  const derivedKey = deriveBcryptPbkdf({ password, salt, rounds, keyLength });

  return `${BCRYPT_PBKDF_PREFIX}${rounds}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
};

const verifyPassword = ({ password, passwordHash } = {}) => {
  if (!isNonEmptyString(password)) {
    return { verified: false, scheme: 'invalid-password', needsRehash: false };
  }

  const scheme = detectHashScheme(passwordHash);

  if (scheme === 'bcrypt-pbkdf') {
    const [roundsRaw, saltHex, hashHex] = passwordHash.slice(BCRYPT_PBKDF_PREFIX.length).split('$');
    const rounds = normalizeBcryptRounds(roundsRaw);
    if (!saltHex || !hashHex) {
      return { verified: false, scheme, needsRehash: false };
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = deriveBcryptPbkdf({
      password,
      salt,
      rounds,
      keyLength: expected.length,
    });

    const verified = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    return {
      verified,
      scheme,
      needsRehash: false,
    };
  }

  if (scheme === 'sha256') {
    const hash = passwordHash.slice(SHA256_PREFIX.length);
    return {
      verified: sha256(password) === hash,
      scheme,
      needsRehash: true,
    };
  }

  if (scheme === 'legacy-sha256') {
    return {
      verified: sha256(password) === passwordHash,
      scheme,
      needsRehash: true,
    };
  }

  return { verified: false, scheme: 'unknown', needsRehash: false };
};

module.exports = {
  BCRYPT_PBKDF_PREFIX,
  SHA256_PREFIX,
  DEFAULT_BCRYPT_PBKDF_ROUNDS,
  detectHashScheme,
  hashPassword,
  verifyPassword,
};
