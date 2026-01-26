const GetQueueService = require('../../../../src/application/user/query/GetQueueService');

describe('GetQueue', () => {
  let service;
  let mockQueueReadRepo;

  beforeEach(() => {
    mockQueueReadRepo = { findByUser: jest.fn() };
    service = new GetQueueService({ queueReadRepository: mockQueueReadRepo });
  });

  it('あとで見る一覧を取得できる', async () => {
    mockQueueReadRepo.findByUser.mockResolvedValue([{ mediaId: 'm1' }]);
    await expect(service.execute({ userId: 'u1' })).resolves.toEqual([{ mediaId: 'm1' }]);
  });

  it('あとで見るが存在しない場合は空配列を返す', async () => {
    mockQueueReadRepo.findByUser.mockResolvedValue([]);
    await expect(service.execute({ userId: 'u1' })).resolves.toEqual([]);
  });

  it('取得に失敗した場合はエラーとなる', async () => {
    mockQueueReadRepo.findByUser.mockRejectedValue(new Error());
    await expect(service.execute({ userId: 'u1' })).rejects.toThrow();
  });
});
