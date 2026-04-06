const crypto = require('crypto');

const LEGACY_SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const DEFAULT_OPTIONS = Object.freeze({
  memoryCost: 65_536,
  iterations: 16_384,
  parallelism: 1,
  timeCost: 8,
  keyLength: 64,
});

const isNonEmptyString = value => typeof value === 'string' && value.length > 0;


const normalizeScryptIterations = value => {
  if (!Number.isFinite(value) || value <= 1) {
    return DEFAULT_OPTIONS.iterations;
  }

  const exponent = Math.floor(Math.log2(value));
  const normalized = 2 ** exponent;
  return normalized > 1 ? normalized : DEFAULT_OPTIONS.iterations;
};

const normalizeOptions = options => {
  const parsed = {
    memoryCost: Number.parseInt(options?.memoryCost, 10),
    iterations: Number.parseInt(options?.iterations, 10),
    parallelism: Number.parseInt(options?.parallelism, 10),
    timeCost: Number.parseInt(options?.timeCost, 10),
    keyLength: Number.parseInt(options?.keyLength, 10),
  };

  return {
    memoryCost: Number.isFinite(parsed.memoryCost) && parsed.memoryCost > 0
      ? parsed.memoryCost
      : DEFAULT_OPTIONS.memoryCost,
    iterations: normalizeScryptIterations(parsed.iterations),
    parallelism: Number.isFinite(parsed.parallelism) && parsed.parallelism > 0
      ? parsed.parallelism
      : DEFAULT_OPTIONS.parallelism,
    timeCost: Number.isFinite(parsed.timeCost) && parsed.timeCost > 0
      ? parsed.timeCost
      : DEFAULT_OPTIONS.timeCost,
    keyLength: Number.isFinite(parsed.keyLength) && parsed.keyLength > 0
      ? parsed.keyLength
      : DEFAULT_OPTIONS.keyLength,
  };
};

const sha256Hex = password => crypto.createHash('sha256').update(password).digest('hex');

const detectHashScheme = passwordHash => {
  if (!isNonEmptyString(passwordHash)) {
    return 'unknown';
  }

  if (passwordHash.startsWith('$scrypt$')) {
    return 'scrypt';
  }

  if (passwordHash.startsWith('sha256$') || LEGACY_SHA256_PATTERN.test(passwordHash)) {
    return 'sha256';
  }

  return 'unknown';
};

const parseScryptHash = encodedHash => {
  const [prefix, paramsText, saltBase64, keyBase64] = encodedHash.split('$').slice(1);
  if (prefix !== 'scrypt' || !isNonEmptyString(paramsText) || !isNonEmptyString(saltBase64) || !isNonEmptyString(keyBase64)) {
    return null;
  }

  const pairs = paramsText.split(',').map(token => token.split('='));
  const params = Object.fromEntries(pairs);
  const iterations = Number.parseInt(params.n, 10);
  const timeCost = Number.parseInt(params.r, 10);
  const parallelism = Number.parseInt(params.p, 10);
  const maxmem = Number.parseInt(params.maxmem, 10);

  if (!Number.isFinite(iterations) || !Number.isFinite(timeCost)
    || !Number.isFinite(parallelism) || !Number.isFinite(maxmem)) {
    return null;
  }

  return {
    iterations,
    timeCost,
    parallelism,
    maxmem,
    salt: Buffer.from(saltBase64, 'base64'),
    key: Buffer.from(keyBase64, 'base64'),
  };
};

const hashPassword = (password, options = {}) => {
  if (!isNonEmptyString(password)) {
    throw new Error('password must be a non-empty string');
  }

  const normalized = normalizeOptions(options);
  const salt = crypto.randomBytes(16);
  const maxmem = normalized.memoryCost * 1024;
  const derivedKey = crypto.scryptSync(password, salt, normalized.keyLength, {
    N: normalized.iterations,
    r: normalized.timeCost,
    p: normalized.parallelism,
    maxmem,
  });

  return [
    '$scrypt',
    `n=${normalized.iterations},r=${normalized.timeCost},p=${normalized.parallelism},maxmem=${maxmem}`,
    salt.toString('base64'),
    derivedKey.toString('base64'),
  ].join('$');
};

const verifyPassword = (password, passwordHash) => {
  if (!isNonEmptyString(password) || !isNonEmptyString(passwordHash)) {
    return false;
  }

  const scheme = detectHashScheme(passwordHash);

  if (scheme === 'sha256') {
    const legacyHash = passwordHash.startsWith('sha256$') ? passwordHash.slice('sha256$'.length) : passwordHash;
    return sha256Hex(password) === legacyHash;
  }

  if (scheme !== 'scrypt') {
    return false;
  }

  const parsed = parseScryptHash(passwordHash);
  if (!parsed || parsed.salt.length === 0 || parsed.key.length === 0) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, parsed.salt, parsed.key.length, {
    N: parsed.iterations,
    r: parsed.timeCost,
    p: parsed.parallelism,
    maxmem: parsed.maxmem,
  });

  return crypto.timingSafeEqual(derivedKey, parsed.key);
};

module.exports = {
  hashPassword,
  verifyPassword,
  detectHashScheme,
  sha256Hex,
  DEFAULT_OPTIONS,
};
