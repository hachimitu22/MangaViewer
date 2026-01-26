const RemoveQueueService = require('../../../../src/application/user/command/RemoveQueueService');

describe('RemoveQueue', () => {
  let service;
  let mockUserRepo;
  let mockMediaRepo;
  let mockQueueRepo;

  beforeEach(() => {
    mockUserRepo = { exists: jest.fn() };
    mockMediaRepo = { exists: jest.fn() };
    mockQueueRepo = { remove: jest.fn(), exists: jest.fn() };

    service = new RemoveQueueService({
      userRepository: mockUserRepo,
      mediaRepository: mockMediaRepo,
      queueRepository: mockQueueRepo,
    });
  });

  it('あとで見るからメディアを削除できる', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockQueueRepo.exists.mockResolvedValue(true);
    mockQueueRepo.remove.mockResolvedValue();

    await expect(service.execute({ userId: 'u1', mediaId: 'm1' })).resolves.not.toThrow();
  });

  it('ユーザーが存在しない場合はエラーとなる', async () => {
    mockUserRepo.exists.mockResolvedValue(false);
    await expect(service.execute({ userId: 'uX', mediaId: 'm1' })).rejects.toThrow();
  });

  it('メディアが存在しない場合はエラーとなる', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(false);
    await expect(service.execute({ userId: 'u1', mediaId: 'mX' })).rejects.toThrow();
  });

  it('あとで見るに追加していないメディアは削除できない', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockQueueRepo.exists.mockResolvedValue(false);

    await expect(service.execute({ userId: 'u1', mediaId: 'm1' })).rejects.toThrow();
  });

  it('永続化に失敗した場合はエラーとなる', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockQueueRepo.exists.mockResolvedValue(true);
    mockQueueRepo.remove.mockRejectedValue(new Error('fail'));

    await expect(service.execute({ userId: 'u1', mediaId: 'm1' })).rejects.toThrow();
  });
});
