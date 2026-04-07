const { toPublicContentPath } = require('../../../../src/controller/screen/publicContentPath');

describe('toPublicContentPath', () => {
  test('32文字16進数IDを分割ディレクトリ付きの公開パスへ変換する', () => {
    expect(toPublicContentPath('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'))
      .toBe('/contents/aa/aa/aa/aa/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('32文字16進数IDが大文字でも小文字に正規化して公開パスへ変換する', () => {
    expect(toPublicContentPath('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'))
      .toBe('/contents/aa/aa/aa/aa/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('既に /contents 配下のパスはそのまま返す', () => {
    expect(toPublicContentPath('/contents/a/b/c.jpg')).toBe('/contents/a/b/c.jpg');
  });

  test.each([
    'http://example.com/evil.jpg',
    'https://example.com/evil.jpg',
    '//example.com/evil.jpg',
    'data:image/png;base64,xxxx',
  ])('外部URLまたは data URL (%s) は拒否して空文字を返す', (value) => {
    expect(toPublicContentPath(value)).toBe('');
  });

  test.each([
    '/etc/passwd',
    '/image/cover.jpg',
    'seed/page-1.jpg',
  ])('許可形式以外 (%s) は空文字を返す', (value) => {
    expect(toPublicContentPath(value)).toBe('');
  });
});
