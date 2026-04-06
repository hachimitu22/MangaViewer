class LoginAttemptStore {
  consumeRateLimit() {
    throw new Error('consumeRateLimit must be implemented');
  }

  getTemporaryLockState() {
    throw new Error('getTemporaryLockState must be implemented');
  }

  recordAuthenticationFailure() {
    throw new Error('recordAuthenticationFailure must be implemented');
  }

  clearAuthenticationFailures() {
    throw new Error('clearAuthenticationFailures must be implemented');
  }
}

module.exports = LoginAttemptStore;
