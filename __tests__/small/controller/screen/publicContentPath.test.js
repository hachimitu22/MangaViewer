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

  test('http/https/protocol-relative URLは拒否する', () => {
    expect(toPublicContentPath('http://example.com/a.jpg')).toBe('');
    expect(toPublicContentPath('https://example.com/a.jpg')).toBe('');
    expect(toPublicContentPath('//example.com/a.jpg')).toBe('');
  });

  test('data URLは拒否する', () => {
    expect(toPublicContentPath('data:image/png;base64,AAAA')).toBe('');
  });

  test('/contents 以外の絶対パスと相対パスは拒否する', () => {
    expect(toPublicContentPath('/tmp/a.jpg')).toBe('');
    expect(toPublicContentPath('seed/page-1.jpg')).toBe('');
  });
});
