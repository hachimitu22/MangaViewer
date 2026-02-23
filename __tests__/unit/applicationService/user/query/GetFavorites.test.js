const GetFavoritesService = require('../../../../src/application/user/query/GetFavoritesService');

describe('GetFavorites', () => {
  let service;
  let mockFavoriteReadRepo;

  beforeEach(() => {
    mockFavoriteReadRepo = { findByUser: jest.fn() };
    service = new GetFavoritesService({ favoriteReadRepository: mockFavoriteReadRepo });
  });

  it('お気に入り一覧を取得できる', async () => {
    mockFavoriteReadRepo.findByUser.mockResolvedValue([{ mediaId: 'm1' }]);
    await expect(service.execute({ userId: 'u1' })).resolves.toEqual([{ mediaId: 'm1' }]);
  });

  it('お気に入りが存在しない場合は空配列を返す', async () => {
    mockFavoriteReadRepo.findByUser.mockResolvedValue([]);
    await expect(service.execute({ userId: 'u1' })).resolves.toEqual([]);
  });

  it('取得に失敗した場合はエラーとなる', async () => {
    mockFavoriteReadRepo.findByUser.mockRejectedValue(new Error());
    await expect(service.execute({ userId: 'u1' })).rejects.toThrow();
  });
});
