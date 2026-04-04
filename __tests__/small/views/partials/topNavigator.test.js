const ejs = require('ejs');
const path = require('path');

const templatePath = path.join(process.cwd(), 'src', 'views', 'partials', 'topNavigator.ejs');

describe('views/partials/topNavigator', () => {
  test('管理者ユーザーではメディア登録リンクを含む', async () => {
    const html = await ejs.renderFile(templatePath, {
      currentPath: '/screen/summary',
      currentUserId: 'admin',
    });

    expect(html).toContain('aria-label="共通ナビゲーター"');
    expect(html).toContain('検索');
    expect(html).toContain('メディア一覧');
    expect(html).toContain('お気に入り');
    expect(html).toContain('あとで見る');
    expect(html).toContain('メディア登録');
    expect(html).toContain('id="common-nav-logout"');
    expect(html).toContain('href="/screen/summary" aria-current=&#39;page&#39;');
  });

  test('一般ユーザーではメディア登録リンクを含まない', async () => {
    const html = await ejs.renderFile(templatePath, {
      currentPath: '/screen/favorite',
      currentUserId: 'user-001',
    });

    expect(html).toContain('メディア一覧');
    expect(html).toContain('検索');
    expect(html).toContain('お気に入り');
    expect(html).toContain('href="/screen/favorite" aria-current=&#39;page&#39;');
    expect(html).not.toContain('メディア登録');
  });

  test('検索画面では検索リンクがカレント表示になる', async () => {
    const html = await ejs.renderFile(templatePath, {
      currentPath: '/screen/search',
      currentUserId: 'user-001',
    });

    expect(html).toContain('href="/screen/search" aria-current=&#39;page&#39;');
  });
});
