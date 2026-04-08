const isNonEmptyString = value => typeof value === 'string' && value.length > 0;

const resolveNodeEnv = (env = {}) => String(env.nodeEnv || process.env.NODE_ENV || '').toLowerCase();

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
  isDevelopmentSessionEnvironment(env)
  && hasDevelopmentSessionConfiguration(env)
);

const resolveDevelopmentSessionApplication = ({ env = {}, requestPath = '' } = {}) => {
  if (!isDevelopmentSessionEnvironment(env)) {
    return { enabled: false, reason: 'environment_not_allowed' };
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
  resolveDevelopmentSessionApplication,
  shouldApplyDevelopmentSession,
};
