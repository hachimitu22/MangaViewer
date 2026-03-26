const { bootstrapE2eApp } = require('../helpers/bootstrapE2eApp');
const { test, expect } = require('@playwright/test');

let page;

test.describe('large e2e: ログイン失敗時の再入力導線', () => {
  let appContext;

  test.beforeEach(async ({ page: currentPage }) => {
    page = currentPage;
    appContext = await bootstrapE2eApp({
      prefix: 'mangaviewer-e2e-auth-login-failure-',
    });
  });

  test.afterEach(async () => {
    if (appContext?.teardown) {
      await appContext.teardown();
    }
    appContext = null;
  });

  test('誤った認証情報では /screen/login に留まり、失敗メッセージ表示後も再入力できる', async () => {
    const { baseUrl } = appContext;

    await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle' });

    await page.type('#username', 'admin');
    await page.type('#password', 'wrong-password');

    const loginResponsePromise = page.waitForResponse(response => {
      return response.url() === `${baseUrl}/api/login` && response.request().method() === 'POST';
    });

    await page.click('button[type="submit"]');

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);
    await expect(loginResponse.json()).resolves.toEqual({ code: 1 });

    await page.waitForFunction(() => {
      const message = document.querySelector('#loginMessage');
      return message && message.textContent.includes('ログインに失敗しました。入力内容をご確認ください。');
    });

    expect(page.url()).toBe(`${baseUrl}/screen/login`);
    expect(page.url()).not.toBe(`${baseUrl}/screen/summary`);

    const loginMessage = await page.$eval('#loginMessage', element => element.textContent.trim());
    expect(loginMessage).toContain('ログインに失敗しました。入力内容をご確認ください。');

    const isUsernameDisabled = await page.$eval('#username', element => element.disabled);
    const isPasswordDisabled = await page.$eval('#password', element => element.disabled);
    expect(isUsernameDisabled).toBe(false);
    expect(isPasswordDisabled).toBe(false);
  });
});
