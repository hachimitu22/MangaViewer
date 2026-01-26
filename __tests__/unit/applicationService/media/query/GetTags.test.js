const GetTagsService = require('../../../../src/application/media/query/GetTagsService');

describe('GetTags', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = { findAll: jest.fn(), findByCategory: jest.fn() };
    service = new GetTagsService({ tagReadRepository: mockRepo });
  });

  it('登録済みタグ一覧を取得できる', async () => {
    mockRepo.findAll.mockResolvedValue([{ category: 'G', label: 'SF' }]);
    await expect(service.execute({})).resolves.toEqual([{ category: 'G', label: 'SF' }]);
  });

  it('カテゴリー別にタグ一覧を取得できる', async () => {
    mockRepo.findByCategory.mockResolvedValue([{ category: 'G', label: 'SF' }]);
    await expect(service.execute({ category: 'G' })).resolves.toEqual([{ category: 'G', label: 'SF' }]);
  });

  it('指定カテゴリーにタグが存在しない場合は空配列を返す', async () => {
    mockRepo.findByCategory.mockResolvedValue([]);
    await expect(service.execute({ category: 'X' })).resolves.toEqual([]);
  });

  it('Repository 取得に失敗した場合は失敗する', async () => {
    mockRepo.findAll.mockRejectedValue(new Error());
    await expect(service.execute({})).rejects.toThrow();
  });
});
