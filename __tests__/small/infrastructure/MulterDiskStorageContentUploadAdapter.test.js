const MulterDiskStorageContentUploadAdapter = require('../../../src/infrastructure/MulterDiskStorageContentUploadAdapter');

describe('MulterDiskStorageContentUploadAdapter', () => {
  test.each([
    undefined,
    null,
    '',
  ])('rootDirectory が %p の場合は初期化時に例外となる', rootDirectory => {
    expect(() => new MulterDiskStorageContentUploadAdapter({ rootDirectory })).toThrow(Error);
  });

  test('大文字のcontentIdでも正規化されて成功する', done => {
    jest.isolateModules(() => {
      jest.doMock('multer', () => {
        const multer = () => ({
          fields: () => (req, _res, cb) => cb(),
        });
        multer.diskStorage = options => options;
        multer.MulterError = class MulterError extends Error {};
        return multer;
      });

      // eslint-disable-next-line global-require
      const Adapter = require('../../../src/infrastructure/MulterDiskStorageContentUploadAdapter');
      const adapter = new Adapter({ rootDirectory: '/tmp' });

      const req = {
        body: {
          contents: {
            0: {
              position: '1',
              id: 'ABCDEF0123456789ABCDEF0123456789',
            },
          },
        },
        files: {},
      };

      adapter.execute(req, {}, error => {
        try {
          expect(error).toBeUndefined();
          expect(req.context.contentIds).toEqual(['abcdef0123456789abcdef0123456789']);
          done();
        } catch (assertionError) {
          done(assertionError);
        }
      });
    });
  });
});
