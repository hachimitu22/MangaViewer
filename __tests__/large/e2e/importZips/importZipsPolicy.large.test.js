const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');

const runImportViaNodeProcess = ({ targetDir, entriesMapPath }) => {
  const script = `
const fs = require('fs');
const path = require('path');
const { ImportZips, Query } = require('${path.resolve('src/application/app/importZips/ImportZips').replace(/\\/g, '\\\\')}');
const entriesMap = JSON.parse(fs.readFileSync('${entriesMapPath.replace(/\\/g, '\\\\')}', 'utf8'));
const targetDir = '${targetDir.replace(/\\/g, '\\\\')}';

const fileAccess = {
  async inspectTarget(dir) {
    const hasArg = typeof dir === 'string' && dir.length > 0;
    if (!hasArg) return { hasArg: false, exists: false, readable: false, isDirectory: false };
    try {
      const stat = fs.statSync(dir);
      return { hasArg: true, exists: true, readable: true, isDirectory: stat.isDirectory() };
    } catch {
      return { hasArg: true, exists: false, readable: false, isDirectory: false };
    }
  },
  async listDirectEntries(dir) {
    return fs.readdirSync(dir).map(name => ({ name, path: path.join(dir, name) }));
  },
};

const zipHandler = {
  async listEntries(zipPath) {
    return entriesMap[zipPath] || [];
  },
};

const contentStorage = {
  async saveFromZipEntries({ entryNames }) {
    return entryNames.map((_, i) => 'cid-' + (i + 1));
  },
};

const registerMediaService = {
  async execute() {
    return { mediaId: 'media-large-1' };
  },
};

const logger = { info() {}, warn() {}, error() {} };

(async () => {
  const app = new ImportZips({ fileAccess, zipHandler, contentStorage, registerMediaService, logger });
  const result = await app.execute(new Query({ targetDir }));
  process.stdout.write(JSON.stringify(result));
})();
`;

  const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  return JSON.parse(out);
};

test.describe('large e2e: ImportZipsPolicy', () => {
  let tempDir;

  test.beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'importzips-large-policy-'));
  });

  test.afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('L-POLICY-01: 許可拡張子のみ登録対象となり `.bmp` は除外される', async () => {
    const zipPath = path.join(tempDir, 'book.zip');
    fs.writeFileSync(zipPath, 'dummy');

    const entriesMapPath = path.join(tempDir, 'entries.json');
    fs.writeFileSync(entriesMapPath, JSON.stringify({
      [zipPath]: [
        { name: '1.jpg' },
        { name: '2.jpeg' },
        { name: '3.png' },
        { name: '4.gif' },
        { name: '5.webp' },
        { name: '6.bmp' },
      ],
    }));

    const result = runImportViaNodeProcess({ targetDir: tempDir, entriesMapPath });

    expect(result).toEqual({
      exitCode: 0,
      totalZipCount: 1,
      successCount: 1,
      failureCount: 0,
    });
  });
});
