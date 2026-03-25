const loginToSummary = async ({ page, baseUrl, username = 'admin', password = 'admin' }) => {
  await page.goto(`${baseUrl}/screen/login`, { waitUntil: 'networkidle0' });

  await page.type('#username', username);
  await page.type('#password', password);

  const loginResponsePromise = page.waitForResponse(response => {
    return response.url() === `${baseUrl}/api/login`
      && response.request().method() === 'POST'
      && response.status() === 200;
  });

  await page.click('button[type="submit"]');

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);

  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  expect(page.url()).toBe(`${baseUrl}/screen/summary`);
};

module.exports = {
  loginToSummary,
};
