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
    if (!entriesMap[zipPath]) {
      throw new Error('no map for zip');
    }
    return entriesMap[zipPath];
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

test.describe('large e2e: ImportZips', () => {
  let tempDir;

  test.beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'importzips-large-'));
  });

  test.afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('L-IMPORT-03: 一部失敗時は終了コード1で成功分のみ集計される', async () => {
    const okZip = path.join(tempDir, 'ok.zip');
    const ngZip = path.join(tempDir, 'ng.zip');
    fs.writeFileSync(okZip, 'ok');
    fs.writeFileSync(ngZip, 'ng');

    const entriesMapPath = path.join(tempDir, 'entries.json');
    fs.writeFileSync(entriesMapPath, JSON.stringify({
      [okZip]: [{ name: '1.jpg' }],
      [ngZip]: [{ name: 'readme.txt' }],
    }));

    const result = runImportViaNodeProcess({ targetDir: tempDir, entriesMapPath });

    expect(result).toEqual({
      exitCode: 1,
      totalZipCount: 2,
      successCount: 1,
      failureCount: 1,
    });
  });

  test('L-IMPORT-05: 対象がディレクトリでない場合は終了コード4で終了する', async () => {
    const filePath = path.join(tempDir, 'not-directory.txt');
    fs.writeFileSync(filePath, 'x');

    const entriesMapPath = path.join(tempDir, 'entries.json');
    fs.writeFileSync(entriesMapPath, JSON.stringify({}));

    const result = runImportViaNodeProcess({ targetDir: filePath, entriesMapPath });

    expect(result).toEqual({
      exitCode: 4,
      totalZipCount: 0,
      successCount: 0,
      failureCount: 0,
    });
  });
});
