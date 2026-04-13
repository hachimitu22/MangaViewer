const LoginAttemptStore = require('./LoginAttemptStore');

const CONSUME_RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = redis.call('PTTL', KEYS[1])
end
return { count, ttl }
`;

const RECORD_AUTH_FAILURE_SCRIPT = `
local now_ms = tonumber(ARGV[1])
local lock_threshold = tonumber(ARGV[2])
local base_lock_ms = tonumber(ARGV[3])
local max_lock_ms = tonumber(ARGV[4])
local failure_state_ttl_ms = tonumber(ARGV[5])

local current_failure_count = tonumber(redis.call('HGET', KEYS[1], 'failure_count')) or 0
local next_failure_count = current_failure_count + 1
local lock_until_ms = tonumber(redis.call('HGET', KEYS[1], 'lock_until_ms')) or 0
local lock_ms = 0

if next_failure_count >= lock_threshold then
  local exponent = next_failure_count - lock_threshold
  lock_ms = math.min(base_lock_ms * (2 ^ exponent), max_lock_ms)
  lock_until_ms = now_ms + lock_ms
end

redis.call('HSET', KEYS[1], 'failure_count', next_failure_count)
redis.call('HSET', KEYS[1], 'lock_until_ms', lock_until_ms)

local ttl_ms = math.max(failure_state_ttl_ms, lock_ms)
if ttl_ms > 0 then
  redis.call('PEXPIRE', KEYS[1], ttl_ms)
end

local is_locked = 0
if now_ms < lock_until_ms then
  is_locked = 1
end

return { next_failure_count, lock_until_ms, is_locked }
`;

class RedisLoginAttemptStore extends LoginAttemptStore {
  #redis;

  #keyPrefix;

  #defaultWindowMs;

  #failureStateTtlMs;

  constructor({
    redis,
    keyPrefix = 'auth',
    defaultWindowMs = 60_000,
    failureStateTtlMs = 86_400_000,
  } = {}) {
    super();

    if (!redis || typeof redis.eval !== 'function') {
      throw new Error('redis.eval must be a function');
    }
    if (typeof redis.del !== 'function') {
      throw new Error('redis.del must be a function');
    }
    if (typeof redis.hGetAll !== 'function') {
      throw new Error('redis.hGetAll must be a function');
    }

    this.#redis = redis;
    this.#keyPrefix = keyPrefix;
    this.#defaultWindowMs = defaultWindowMs;
    this.#failureStateTtlMs = failureStateTtlMs;
  }

  async consumeRateLimit({ scope, key, windowMs, nowMs = Date.now() } = {}) {
    const bucketKey = this.#rateLimitKey({ scope, key });
    const currentWindowMs = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : this.#defaultWindowMs;

    const [count, ttlMs] = await this.#redis.eval(CONSUME_RATE_LIMIT_SCRIPT, {
      keys: [bucketKey],
      arguments: [String(currentWindowMs)],
    });

    return {
      count: Number.parseInt(count, 10),
      resetAtMs: nowMs + Number.parseInt(ttlMs, 10),
    };
  }

  async clearRateLimit({ scope, key } = {}) {
    await this.#redis.del(this.#rateLimitKey({ scope, key }));
  }

  async getTemporaryLockState({ key, nowMs = Date.now() } = {}) {
    const state = await this.#redis.hGetAll(this.#failureKey(key));
    const failureCount = Number.parseInt(state.failure_count || '0', 10);
    const lockUntilMs = Number.parseInt(state.lock_until_ms || '0', 10);

    return {
      isLocked: nowMs < lockUntilMs,
      failureCount,
      lockUntilMs,
    };
  }

  async recordAuthenticationFailure({
    key,
    nowMs = Date.now(),
    lockThreshold = 3,
    baseLockMs = 1_000,
    maxLockMs = 60_000,
  } = {}) {
    const [failureCount, lockUntilMs, isLocked] = await this.#redis.eval(RECORD_AUTH_FAILURE_SCRIPT, {
      keys: [this.#failureKey(key)],
      arguments: [
        String(nowMs),
        String(lockThreshold),
        String(baseLockMs),
        String(maxLockMs),
        String(this.#failureStateTtlMs),
      ],
    });

    return {
      failureCount: Number.parseInt(failureCount, 10),
      lockUntilMs: Number.parseInt(lockUntilMs, 10),
      isLocked: Number.parseInt(isLocked, 10) === 1,
    };
  }

  async clearAuthenticationFailures({ key } = {}) {
    await this.#redis.del(this.#failureKey(key));
  }

  #rateLimitKey({ scope, key }) {
    return `${this.#keyPrefix}:rate_limit:${scope || 'unknown'}:${key || 'anonymous'}`;
  }

  #failureKey(key) {
    return `${this.#keyPrefix}:auth_failure:${key || 'anonymous'}`;
  }
}

module.exports = RedisLoginAttemptStore;
