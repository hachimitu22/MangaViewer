const AddFavoriteService = require('../../../../src/application/user/command/AddFavoriteService');

describe('AddFavorite', () => {
  let service;
  let mockUserRepo;
  let mockMediaRepo;
  let mockFavoriteRepo;

  beforeEach(() => {
    mockUserRepo = { exists: jest.fn() };
    mockMediaRepo = { exists: jest.fn() };
    mockFavoriteRepo = { add: jest.fn(), exists: jest.fn() };

    service = new AddFavoriteService({
      userRepository: mockUserRepo,
      mediaRepository: mockMediaRepo,
      favoriteRepository: mockFavoriteRepo,
    });
  });

  it('メディアをお気に入りに追加できる', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockFavoriteRepo.exists.mockResolvedValue(false);
    mockFavoriteRepo.add.mockResolvedValue();

    await expect(
      service.execute({ userId: 'u1', mediaId: 'm1' })
    ).resolves.not.toThrow();
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

  it('同じメディアを複数回お気に入りに追加できない', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockFavoriteRepo.exists.mockResolvedValue(true);

    await expect(service.execute({ userId: 'u1', mediaId: 'm1' })).rejects.toThrow();
  });

  it('永続化に失敗した場合はエラーとなる', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockFavoriteRepo.exists.mockResolvedValue(false);
    mockFavoriteRepo.add.mockRejectedValue(new Error('fail'));

    await expect(service.execute({ userId: 'u1', mediaId: 'm1' })).rejects.toThrow();
  });
});
