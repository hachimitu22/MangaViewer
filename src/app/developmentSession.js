const isNonEmptyString = value => typeof value === 'string' && value.length > 0;

const hasDevelopmentSession = (env = {}) => (
  isNonEmptyString(env.devSessionToken)
  && isNonEmptyString(env.devSessionUserId)
  && Number.isInteger(env.devSessionTtlMs)
  && env.devSessionTtlMs > 0
);

const shouldApplyDevelopmentSession = ({ env = {}, requestPath = '' } = {}) => {
  if (!hasDevelopmentSession(env)) {
    return false;
  }

  return Array.isArray(env.devSessionPaths)
    && env.devSessionPaths.includes(requestPath);
};

module.exports = {
  hasDevelopmentSession,
  shouldApplyDevelopmentSession,
};
