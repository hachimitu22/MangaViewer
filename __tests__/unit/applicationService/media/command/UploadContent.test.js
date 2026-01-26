const UploadContentService = require('../../../../src/application/media/command/UploadContentService');

describe('UploadContent', () => {
  let service;
  let mockStorage;

  beforeEach(() => {
    mockStorage = { saveAll: jest.fn() };
    service = new UploadContentService({ storage: mockStorage });
  });

  it('コンテンツを保存できる', async () => {
    mockStorage.saveAll.mockResolvedValue(true);

    await expect(
      service.execute({ contents: [{ path: 'valid1' }] })
    ).resolves.toEqual({ success: true });
  });

  it('複数コンテンツをまとめて保存できる', async () => {
    mockStorage.saveAll.mockResolvedValue(true);

    await expect(
      service.execute({ contents: [{ path: 'v1' }, { path: 'v2' }] })
    ).resolves.toEqual({ success: true });
  });

  it('コンテンツ保存に失敗した場合はエラーとなる', async () => {
    mockStorage.saveAll.mockRejectedValue(new Error());

    await expect(
      service.execute({ contents: [{ path: 'v1' }] })
    ).rejects.toThrow();
  });

  it('空のコンテンツ一覧を指定した場合はエラーとなる', async () => {
    await expect(
      service.execute({ contents: [] })
    ).rejects.toThrow();
  });

  it('無効なパスが含まれている場合はエラーとなる', async () => {
    await expect(
      service.execute({ contents: [{ path: '' }] })
    ).rejects.toThrow();
  });
});
