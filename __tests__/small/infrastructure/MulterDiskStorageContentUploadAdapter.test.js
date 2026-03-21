const MulterDiskStorageContentUploadAdapter = require('../../../src/infrastructure/MulterDiskStorageContentUploadAdapter');

describe('MulterDiskStorageContentUploadAdapter', () => {
  test.each([
    undefined,
    null,
    '',
  ])('rootDirectory が %p の場合は初期化時に例外となる', rootDirectory => {
    expect(() => new MulterDiskStorageContentUploadAdapter({ rootDirectory })).toThrow(Error);
  });
});
