const ejs = require('ejs');
const path = require('path');

const templatePath = path.join(process.cwd(), 'src', 'views', 'partials', 'topNavigator.ejs');

describe('views/partials/topNavigator', () => {
  test('共通ナビゲーターのリンクを表示する', async () => {
    const html = await ejs.renderFile(templatePath, {
      currentPath: '/screen/summary',
    });

    expect(html).toContain('aria-label="共通ナビゲーター"');
    expect(html).toContain('メディア一覧');
    expect(html).toContain('メディア検索');
    expect(html).toContain('メディア登録');
    expect(html).toContain('href="/screen/summary" aria-current=&#39;page&#39;');
  });

  test('currentPath に応じて aria-current を切り替える', async () => {
    const html = await ejs.renderFile(templatePath, {
      currentPath: '/screen/search',
    });

    expect(html).toContain('href="/screen/search" aria-current=&#39;page&#39;');
    expect(html).not.toContain('id="common-nav-logout"');
  });
});
