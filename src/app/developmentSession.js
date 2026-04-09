const isNonEmptyString = value => typeof value === 'string' && value.length > 0;

const resolveNodeEnv = (env = {}) => String(env.nodeEnv || process.env.NODE_ENV || '').toLowerCase();
const isDevelopmentSessionExplicitlyEnabled = (env = {}) => env.enableDevSession === 'true';
const normalizeHost = host => String(host || '')
  .trim()
  .replace(/^\[|\]$/g, '')
  .split(':')[0]
  .toLowerCase();
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const isLoopbackHost = host => {
  const normalizedHost = normalizeHost(host);
  if (LOOPBACK_HOSTS.has(normalizedHost)) {
    return true;
  }
  return normalizedHost.startsWith('127.');
};

const isDevelopmentSessionEnvironment = (env = {}) => {
  const nodeEnv = resolveNodeEnv(env);
  return nodeEnv === 'development' || nodeEnv === 'test';
};

const isDevelopmentSessionLoopbackHost = (env = {}) => (
  !isNonEmptyString(env.host)
  || isLoopbackHost(env.host)
);

const hasDevelopmentSessionConfiguration = (env = {}) => (
  isNonEmptyString(env.devSessionToken)
  && isNonEmptyString(env.devSessionUserId)
  && Number.isInteger(env.devSessionTtlMs)
  && env.devSessionTtlMs > 0
);

const hasDevelopmentSession = (env = {}) => (
  isDevelopmentSessionExplicitlyEnabled(env)
  && isDevelopmentSessionEnvironment(env)
  && isDevelopmentSessionLoopbackHost(env)
  && hasDevelopmentSessionConfiguration(env)
);

const resolveDevelopmentSessionApplication = ({ env = {}, requestPath = '' } = {}) => {
  if (!isDevelopmentSessionExplicitlyEnabled(env)) {
    return { enabled: false, reason: 'explicit_flag_disabled' };
  }

  if (!isDevelopmentSessionEnvironment(env)) {
    return { enabled: false, reason: 'environment_not_allowed' };
  }

  if (!isDevelopmentSessionLoopbackHost(env)) {
    return { enabled: false, reason: 'host_not_loopback' };
  }

  if (!hasDevelopmentSessionConfiguration(env)) {
    return { enabled: false, reason: 'configuration_incomplete' };
  }

  if (!Array.isArray(env.devSessionPaths)) {
    return { enabled: false, reason: 'paths_not_configured' };
  }

  if (!env.devSessionPaths.includes(requestPath)) {
    return { enabled: false, reason: 'path_not_targeted' };
  }

  return { enabled: true, reason: 'enabled' };
};

const shouldApplyDevelopmentSession = ({ env = {}, requestPath = '' } = {}) => {
  const decision = resolveDevelopmentSessionApplication({ env, requestPath });
  return decision.enabled;
};

module.exports = {
  hasDevelopmentSession,
  isLoopbackHost,
  isDevelopmentSessionExplicitlyEnabled,
  resolveDevelopmentSessionApplication,
  shouldApplyDevelopmentSession,
};
