const fs = require('fs');
const path = require('path');

const stripQuotes = value => {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
};

const parseEnvLine = line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const rawValue = trimmed.slice(separatorIndex + 1).trim();
  const value = stripQuotes(rawValue);

  if (!key) {
    return null;
  }

  return { key, value };
};

const loadEnvFile = envFilePath => {
  const resolvedPath = path.resolve(process.cwd(), envFilePath);

  if (!fs.existsSync(resolvedPath)) {
    console.warn(`環境変数ファイルが見つからないため読み込みをスキップします: ${resolvedPath}`);
    return;
  }

  const content = fs.readFileSync(resolvedPath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      continue;
    }

    if (typeof process.env[parsed.key] === 'undefined') {
      process.env[parsed.key] = parsed.value;
    }
  }
};

const envFilePath = process.env.ENV_FILE || '.env';
loadEnvFile(envFilePath);

require('../src/server');
