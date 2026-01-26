const RemoveFavoriteService = require('../../../../src/application/user/command/RemoveFavoriteService');

describe('RemoveFavorite', () => {
  let service;
  let mockUserRepo;
  let mockMediaRepo;
  let mockFavoriteRepo;

  beforeEach(() => {
    mockUserRepo = { exists: jest.fn() };
    mockMediaRepo = { exists: jest.fn() };
    mockFavoriteRepo = { remove: jest.fn(), exists: jest.fn() };

    service = new RemoveFavoriteService({
      userRepository: mockUserRepo,
      mediaRepository: mockMediaRepo,
      favoriteRepository: mockFavoriteRepo,
    });
  });

  it('お気に入りからメディアを削除できる', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockFavoriteRepo.exists.mockResolvedValue(true);
    mockFavoriteRepo.remove.mockResolvedValue();

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

  it('お気に入りしていないメディアは削除できない', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockFavoriteRepo.exists.mockResolvedValue(false);

    await expect(service.execute({ userId: 'u1', mediaId: 'm1' })).rejects.toThrow();
  });

  it('永続化に失敗した場合はエラーとなる', async () => {
    mockUserRepo.exists.mockResolvedValue(true);
    mockMediaRepo.exists.mockResolvedValue(true);
    mockFavoriteRepo.exists.mockResolvedValue(true);
    mockFavoriteRepo.remove.mockRejectedValue(new Error('fail'));

    await expect(service.execute({ userId: 'u1', mediaId: 'm1' })).rejects.toThrow();
  });
});
