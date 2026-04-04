const { toPublicContentPath } = require('../../../../src/controller/screen/publicContentPath');

describe('toPublicContentPath', () => {
  test('32文字16進数IDを分割ディレクトリ付きの公開パスへ変換する', () => {
    expect(toPublicContentPath('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'))
      .toBe('/contents/aa/aa/aa/aa/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('既に /contents 配下のパスはそのまま返す', () => {
    expect(toPublicContentPath('/contents/a/b/c.jpg')).toBe('/contents/a/b/c.jpg');
  });

  test('相対パスは /contents を先頭に付与する', () => {
    expect(toPublicContentPath('seed/page-1.jpg')).toBe('/contents/seed/page-1.jpg');
  });
});
