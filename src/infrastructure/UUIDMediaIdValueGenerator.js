const { randomUUID } = require('crypto');

const IMediaIdValueGenerator = require('../domain/media/IMediaIdValueGenerator');

module.exports = class UUIDMediaIdValueGenerator extends IMediaIdValueGenerator {
  generate() {
    return randomUUID().replace(/-/g, '');
  }
};
