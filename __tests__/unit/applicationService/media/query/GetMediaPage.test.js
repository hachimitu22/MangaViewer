const GetMediaPageService = require('../../../../src/application/media/query/GetMediaPageService');

describe('GetMediaPage', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = { findPage: jest.fn() };
    service = new GetMediaPageService({ mediaReadRepository: mockRepo });
  });

  it('指定したページのコンテンツを取得できる', async () => {
    mockRepo.findPage.mockResolvedValue({ content: 'page1', pageInfo: {} });
    await expect(service.execute({ mediaId: 'm', page: 1 })).resolves.toBeDefined();
  });

  it('ページ番号が範囲外の場合は取得できない', async () => {
    mockRepo.findPage.mockResolvedValue(null);
    await expect(service.execute({ mediaId: 'm', page: 999 })).rejects.toThrow();
  });

  it('存在しないメディアIDの場合は取得できない', async () => {
    mockRepo.findPage.mockResolvedValue(null);
    await expect(service.execute({ mediaId: 'no', page: 1 })).rejects.toThrow();
  });

  it('Repository 取得に失敗した場合は失敗する', async () => {
    mockRepo.findPage.mockRejectedValue(new Error());
    await expect(service.execute({ mediaId: 'm', page: 1 })).rejects.toThrow();
  });
});
