const extractSessionTokenFromCookie = cookieHeader => {
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) {
    return undefined;
  }

  const pair = cookieHeader
    .split(';')
    .map(entry => entry.trim())
    .find(entry => entry.startsWith('session_token='));

  if (!pair) {
    return undefined;
  }

  const [, value = ''] = pair.split('=');
  return value || undefined;
};

module.exports = {
  extractSessionTokenFromCookie,
};
