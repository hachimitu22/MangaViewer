const isNonEmptyString = value => typeof value === 'string' && value.length > 0;

const resolveNodeEnv = (env = {}) => String(env.nodeEnv || process.env.NODE_ENV || '').toLowerCase();
const isDevelopmentSessionExplicitlyEnabled = (env = {}) => env.enableDevSession === 'true';
const normalizeHost = value => String(value || '').trim().toLowerCase();

const extractHostName = value => {
  const host = normalizeHost(value);
  if (host.length === 0) {
    return '';
  }

  if (host.startsWith('[') && host.includes(']')) {
    return host.slice(1, host.indexOf(']'));
  }

  const firstColonIndex = host.indexOf(':');
  if (firstColonIndex <= 0) {
    return host;
  }

  if (host.includes('.')) {
    return host.slice(0, firstColonIndex);
  }

  return host;
};

const isLoopbackHost = value => {
  const host = extractHostName(value);
  if (host.length === 0) {
    return false;
  }

  if (host === 'localhost' || host === '::1') {
    return true;
  }

  if (host === '127.0.0.1') {
    return true;
  }

  return host.startsWith('127.');
};

const isDevelopmentSessionEnvironment = (env = {}) => {
  const nodeEnv = resolveNodeEnv(env);
  return nodeEnv === 'development' || nodeEnv === 'test';
};

const hasDevelopmentSessionConfiguration = (env = {}) => (
  isNonEmptyString(env.devSessionToken)
  && isNonEmptyString(env.devSessionUserId)
  && Number.isInteger(env.devSessionTtlMs)
  && env.devSessionTtlMs > 0
);

const hasDevelopmentSession = (env = {}) => (
  isDevelopmentSessionExplicitlyEnabled(env)
  && isDevelopmentSessionEnvironment(env)
  && hasDevelopmentSessionConfiguration(env)
  && isLoopbackHost(env.serverHost)
);

const resolveDevelopmentSessionApplication = ({ env = {}, requestPath = '', requestHost = '' } = {}) => {
  if (!isDevelopmentSessionExplicitlyEnabled(env)) {
    return { enabled: false, reason: 'explicit_flag_disabled' };
  }

  if (!isDevelopmentSessionEnvironment(env)) {
    return { enabled: false, reason: 'environment_not_allowed' };
  }

  if (!hasDevelopmentSessionConfiguration(env)) {
    return { enabled: false, reason: 'configuration_incomplete' };
  }

  if (!isLoopbackHost(requestHost)) {
    return { enabled: false, reason: 'request_host_not_loopback' };
  }

  if (!Array.isArray(env.devSessionPaths)) {
    return { enabled: false, reason: 'paths_not_configured' };
  }

  if (!env.devSessionPaths.includes(requestPath)) {
    return { enabled: false, reason: 'path_not_targeted' };
  }

  return { enabled: true, reason: 'enabled' };
};

const shouldApplyDevelopmentSession = ({ env = {}, requestPath = '', requestHost = '' } = {}) => {
  const decision = resolveDevelopmentSessionApplication({ env, requestPath, requestHost });
  return decision.enabled;
};

module.exports = {
  isLoopbackHost,
  hasDevelopmentSession,
  isDevelopmentSessionExplicitlyEnabled,
  resolveDevelopmentSessionApplication,
  shouldApplyDevelopmentSession,
};
