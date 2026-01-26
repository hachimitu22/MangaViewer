const AddQueueService = require('../../../../src/application/user/command/AddQueueService');

describe('AddQueue', () => {
  let service;
  let mockUserRepo;
  let mockMediaRepo;
  let mockQueueRepo;

  beforeEach(() => {
    mockUserRepo = { exists: jest.fn() };
    mockMediaRepo = { exists: jest.fn() };
    mockQueueRepo = { add: jest.fn(), exists: jest.fn() };

    service = new AddQueueService({
      userRepository: mockUserRepo,
      mediaRepository: mockMediaRepo,
      queueRepository: mockQueueRepo,
    });
  });

  it('メディアをあとで見るに追加できる', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockQueueRepo.exists.mockResolvedValue(false);
    mockQueueRepo.add.mockResolvedValue();

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

  it('同じメディアを複数回あとで見るに追加できない', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockQueueRepo.exists.mockResolvedValue(true);

    await expect(service.execute({ userId: 'u1', mediaId: 'm1' })).rejects.toThrow();
  });

  it('永続化に失敗した場合はエラーとなる', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockQueueRepo.exists.mockResolvedValue(false);
    mockQueueRepo.add.mockRejectedValue(new Error('fail'));

    await expect(service.execute({ userId: 'u1', mediaId: 'm1' })).rejects.toThrow();
  });
});
