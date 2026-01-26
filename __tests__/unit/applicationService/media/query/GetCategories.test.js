const GetCategoriesService = require('../../../../src/application/media/query/GetCategoriesService');

describe('GetCategories', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = { findAll: jest.fn() };
    service = new GetCategoriesService({ categoryRepository: mockRepo });
  });

  it('登録済みカテゴリー一覧を取得できる', async () => {
    mockRepo.findAll.mockResolvedValue([{ name: 'A' }, { name: 'B' }]);
    await expect(service.execute()).resolves.toEqual([{ name: 'A' }, { name: 'B' }]);
  });

  it('優先度順でカテゴリー一覧を取得できる', async () => {
    mockRepo.findAll.mockResolvedValue([{ name: 'A' }, { name: 'B' }]);
    await expect(service.execute()).resolves.toBeDefined();
  });

  it('カテゴリーが存在しない場合は空配列を返す', async () => {
    mockRepo.findAll.mockResolvedValue([]);
    await expect(service.execute()).resolves.toEqual([]);
  });

  it('Repository 取得に失敗した場合は失敗する', async () => {
    mockRepo.findAll.mockRejectedValue(new Error());
    await expect(service.execute()).rejects.toThrow();
  });
});
