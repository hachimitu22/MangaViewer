const crypto = require('crypto');

const hashPassword = password => {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('password must be a non-empty string');
  }

  return crypto.createHash('sha256').update(password).digest('hex');
};

module.exports = {
  hashPassword,
};
