const fs = require('fs');
const path = require('path');

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /secret/i,
];

const LEVEL_PRIORITIES = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

const normalizeLevel = value => {
  const level = String(value || 'INFO').toUpperCase();
  return LEVEL_PRIORITIES[level] ? level : 'INFO';
};

const ensureParentDirectory = targetPath => {
  const directory = path.dirname(targetPath);
  fs.mkdirSync(directory, { recursive: true });
};

const sanitize = (value, key = '') => {
  if (Array.isArray(value)) {
    return value.map(entry => sanitize(entry));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(value.cause ? { cause: sanitize(value.cause, 'cause') } : {}),
    };
  }

  if (!value || typeof value !== 'object') {
    return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key))
      ? '[REDACTED]'
      : value;
  }

  return Object.entries(value).reduce((safeValue, [entryKey, entryValue]) => {
    if (SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(entryKey))) {
      safeValue[entryKey] = '[REDACTED]';
      return safeValue;
    }

    safeValue[entryKey] = sanitize(entryValue, entryKey);
    return safeValue;
  }, {});
};

class AppLogger {
  #level;

  #filePath;

  #outputs;

  #memoryRecords;

  constructor({ level = 'INFO', filePath, outputs = ['console', 'file'] } = {}) {
    this.#level = normalizeLevel(level);
    this.#filePath = filePath;
    this.#outputs = new Set(Array.isArray(outputs) ? outputs : ['console', 'file']);
    this.#memoryRecords = [];

    if (this.#outputs.has('file') && typeof filePath === 'string' && filePath.length > 0) {
      ensureParentDirectory(filePath);
    } else if (this.#outputs.has('file')) {
      this.#outputs.delete('file');
    }
  }

  debug(event, payload = {}) {
    this.#write('DEBUG', event, payload);
  }

  info(event, payload = {}) {
    this.#write('INFO', event, payload);
  }

  warn(event, payload = {}) {
    this.#write('WARN', event, payload);
  }

  error(event, payload = {}) {
    this.#write('ERROR', event, payload);
  }

  #write(level, event, payload) {
    if (LEVEL_PRIORITIES[level] < LEVEL_PRIORITIES[this.#level]) {
      return;
    }

    const record = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...sanitize(payload),
    };
    const message = JSON.stringify(record);

    if (this.#outputs.has('console')) {
      if (level === 'ERROR' || level === 'WARN') {
        console.error(message);
      } else {
        console.log(message);
      }
    }

    if (this.#outputs.has('file')) {
      fs.appendFile(this.#filePath, `${message}\n`, () => {});
    }

    if (this.#outputs.has('memory')) {
      this.#memoryRecords.push(record);
    }
  }

  getRecords() {
    return [...this.#memoryRecords];
  }

  clearRecords() {
    this.#memoryRecords.length = 0;
  }
}

module.exports = {
  AppLogger,
};
