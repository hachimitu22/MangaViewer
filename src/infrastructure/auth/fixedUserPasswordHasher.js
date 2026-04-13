const { hashPassword, sha256Hex } = require('./passwordHasher');

module.exports = {
  hashPassword,
  hashLegacyPassword: sha256Hex,
};
