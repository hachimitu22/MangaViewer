const LoginAttemptStore = require('./LoginAttemptStore');

class InMemoryLoginAttemptStore extends LoginAttemptStore {
  #rateLimitBuckets;

  #failureStates;

  constructor() {
    super();
    this.#rateLimitBuckets = new Map();
    this.#failureStates = new Map();
  }

  consumeRateLimit({ scope, key, windowMs, nowMs = Date.now() } = {}) {
    const bucketKey = `${scope || 'unknown'}:${key || 'anonymous'}`;
    const currentWindowMs = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000;
    const current = this.#rateLimitBuckets.get(bucketKey);

    if (!current || nowMs >= current.resetAtMs) {
      const next = {
        count: 1,
        resetAtMs: nowMs + currentWindowMs,
      };
      this.#rateLimitBuckets.set(bucketKey, next);
      return { count: next.count, resetAtMs: next.resetAtMs };
    }

    current.count += 1;
    this.#rateLimitBuckets.set(bucketKey, current);
    return {
      count: current.count,
      resetAtMs: current.resetAtMs,
    };
  }

  getTemporaryLockState({ key, nowMs = Date.now() } = {}) {
    const state = this.#failureStates.get(key);
    if (!state) {
      return {
        isLocked: false,
        failureCount: 0,
        lockUntilMs: 0,
      };
    }

    const isLocked = nowMs < state.lockUntilMs;
    if (!isLocked && state.failureCount === 0) {
      this.#failureStates.delete(key);
      return {
        isLocked: false,
        failureCount: 0,
        lockUntilMs: 0,
      };
    }

    return {
      isLocked,
      failureCount: state.failureCount,
      lockUntilMs: state.lockUntilMs,
    };
  }

  recordAuthenticationFailure({
    key,
    nowMs = Date.now(),
    lockThreshold = 3,
    baseLockMs = 1_000,
    maxLockMs = 60_000,
  } = {}) {
    const current = this.#failureStates.get(key) || {
      failureCount: 0,
      lockUntilMs: 0,
    };

    const failureCount = current.failureCount + 1;
    let lockUntilMs = current.lockUntilMs;

    if (failureCount >= lockThreshold) {
      const exponent = failureCount - lockThreshold;
      const lockMs = Math.min(baseLockMs * (2 ** exponent), maxLockMs);
      lockUntilMs = nowMs + lockMs;
    }

    const next = { failureCount, lockUntilMs };
    this.#failureStates.set(key, next);
    return {
      failureCount,
      lockUntilMs,
      isLocked: nowMs < lockUntilMs,
    };
  }

  clearAuthenticationFailures({ key } = {}) {
    this.#failureStates.delete(key);
  }
}

module.exports = InMemoryLoginAttemptStore;
