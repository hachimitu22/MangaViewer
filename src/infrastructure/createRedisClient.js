const createRedisClient = ({ url } = {}) => {
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('redisUrl must be a non-empty string when Redis store is enabled');
  }

  let createClient;
  try {
    ({ createClient } = require('redis'));
  } catch (error) {
    throw new Error('Redisバックエンドを利用するには redis パッケージのインストールが必要です');
  }

  return createClient({ url });
};

module.exports = createRedisClient;
