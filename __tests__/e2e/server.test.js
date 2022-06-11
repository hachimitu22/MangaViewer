describe('top', () => {
  beforeAll(async () => {
    await page.goto(`http://localhost:3000`);
  });

  it(`'top' is there`, async () => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('top');
  });
});

