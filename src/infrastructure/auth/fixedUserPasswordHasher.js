const crypto = require('crypto');

const LEGACY_SHA256_REGEX = /^[a-f0-9]{64}$/;
const SCRYPT_PREFIX = '$scrypt$';
const DEFAULT_SCRYPT_CONFIG = {
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
};

const assertNonEmptyPassword = password => {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('password must be a non-empty string');
  }
};

const hashPassword = password => {
  assertNonEmptyPassword(password);

  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, DEFAULT_SCRYPT_CONFIG.keylen, {
    N: DEFAULT_SCRYPT_CONFIG.N,
    r: DEFAULT_SCRYPT_CONFIG.r,
    p: DEFAULT_SCRYPT_CONFIG.p,
  });

  return [
    SCRYPT_PREFIX.slice(0, -1),
    `N=${DEFAULT_SCRYPT_CONFIG.N}`,
    `r=${DEFAULT_SCRYPT_CONFIG.r}`,
    `p=${DEFAULT_SCRYPT_CONFIG.p}`,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
};

const isLegacySha256Hash = value => (
  typeof value === 'string' && LEGACY_SHA256_REGEX.test(value)
);

const parseScryptHash = storedHash => {
  if (typeof storedHash !== 'string' || !storedHash.startsWith(SCRYPT_PREFIX)) {
    return null;
  }

  const parts = storedHash.slice(SCRYPT_PREFIX.length).split('$');
  if (parts.length !== 5) {
    return null;
  }

  const [nToken, rToken, pToken, saltBase64, hashBase64] = parts;
  const N = Number.parseInt(nToken.replace('N=', ''), 10);
  const r = Number.parseInt(rToken.replace('r=', ''), 10);
  const p = Number.parseInt(pToken.replace('p=', ''), 10);

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N <= 0 || r <= 0 || p <= 0) {
    return null;
  }

  try {
    const salt = Buffer.from(saltBase64, 'base64');
    const hash = Buffer.from(hashBase64, 'base64');
    if (salt.length === 0 || hash.length === 0) {
      return null;
    }
    return {
      N,
      r,
      p,
      salt,
      hash,
    };
  } catch (error) {
    return null;
  }
};

const verifyPassword = ({ password, storedHash } = {}) => {
  assertNonEmptyPassword(password);

  if (typeof storedHash !== 'string' || storedHash.length === 0) {
    return {
      verified: false,
      needsRehash: false,
      newHash: null,
      format: 'invalid',
    };
  }

  const scryptHash = parseScryptHash(storedHash);
  if (scryptHash) {
    const derived = crypto.scryptSync(password, scryptHash.salt, scryptHash.hash.length, {
      N: scryptHash.N,
      r: scryptHash.r,
      p: scryptHash.p,
    });
    return {
      verified: crypto.timingSafeEqual(derived, scryptHash.hash),
      needsRehash: false,
      newHash: null,
      format: 'scrypt',
    };
  }

  if (isLegacySha256Hash(storedHash)) {
    const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
    const verified = legacyHash === storedHash;

    return {
      verified,
      needsRehash: verified,
      newHash: verified ? hashPassword(password) : null,
      format: 'legacy-sha256',
    };
  }

  return {
    verified: false,
    needsRehash: false,
    newHash: null,
    format: 'unknown',
  };
};

module.exports = {
  hashPassword,
  verifyPassword,
  isLegacySha256Hash,
};
