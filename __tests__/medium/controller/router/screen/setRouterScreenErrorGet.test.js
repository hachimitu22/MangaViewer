const express = require('express');
const path = require('path');

const setRouterScreenErrorGet = require('../../../../../src/controller/router/screen/setRouterScreenErrorGet');

const requestApp = async ({ app, method, targetPath } = {}) => {
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${targetPath}`, {
      method,
    });

    return {
      status: response.status,
      headers: response.headers,
      bodyText: await response.text(),
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
};

describe('setRouterScreenErrorGet (middle)', () => {
  const createApp = () => {
    const app = express();
    const router = express.Router();

    app.set('views', path.join(process.cwd(), 'src', 'views'));
    app.set('view engine', 'ejs');

    setRouterScreenErrorGet({ router });

    app.use(router);
    return app;
  };

  test('GET /screen/error で error.ejs を描画した HTML を返す', async () => {
    const app = createApp();

    const response = await requestApp({
      app,
      method: 'GET',
      targetPath: '/screen/error',
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.bodyText).toContain('<!DOCTYPE html>');
    expect(response.bodyText).toContain('<title>エラーが発生しました</title>');
    expect(response.bodyText).toContain('ページを表示できませんでした');
    expect(response.bodyText).toContain('認証情報の確認が必要な場合や、対象のデータが見つからない場合、あるいは一時的な問題が発生した場合にこの画面が表示されます。時間をおいて再度お試しいただくか、別の画面へお戻りください。');
    expect(response.bodyText).toContain('href="/screen/login"');
    expect(response.bodyText).toContain('href="/screen/summary"');
    expect(response.bodyText).toContain('href="/screen/entry"');
    expect(response.bodyText).toContain('ログイン画面へ戻る');
    expect(response.bodyText).toContain('一覧・サマリー画面へ戻る');
    expect(response.bodyText).toContain('登録画面へ戻る');
    expect(response.bodyText).toContain('認証失敗、対象データ未存在、予期しないエラーのいずれでも利用できる共通の案内ページです。');
    expect(response.bodyText).not.toContain(path.join('src', 'views', 'screen', 'error.ejs'));
  });
});
