const GetMediaService = require('../../../../src/application/media/query/GetMediaService');

describe('GetMedia', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = { findById: jest.fn() };
    service = new GetMediaService({ mediaReadRepository: mockRepo });
  });

  it('指定したメディアIDの詳細を取得できる', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'm', title: 'T', tags: [], contents: [] });
    await expect(service.execute({ mediaId: 'm' })).resolves.toMatchObject({ id: 'm' });
  });

  it('存在しないメディアIDの場合は取得できない', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.execute({ mediaId: 'no' })).rejects.toThrow();
  });

  it('Repository 取得に失敗した場合は失敗する', async () => {
    mockRepo.findById.mockRejectedValue(new Error());
    await expect(service.execute({ mediaId: 'm' })).rejects.toThrow();
  });
});
