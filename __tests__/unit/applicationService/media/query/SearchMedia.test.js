const SearchMediaService = require('../../../../src/application/media/query/SearchMediaService');

describe('SearchMedia', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = { search: jest.fn() };
    service = new SearchMediaService({ mediaReadRepository: mockRepo });
  });

  it('条件に一致するメディア一覧を取得できる', async () => {
    mockRepo.search.mockResolvedValue([{ id: '1' }]);
    await expect(service.execute({ title: 'X' })).resolves.toEqual([{ id: '1' }]);
  });

  it('検索結果が0件でも空配列を返す', async () => {
    mockRepo.search.mockResolvedValue([]);
    await expect(service.execute({ title: 'X' })).resolves.toEqual([]);
  });

  it('不正なページング条件の場合は取得できない', async () => {
    await expect(service.execute({ page: -1 })).rejects.toThrow();
  });

  it('Repository 取得に失敗した場合は失敗する', async () => {
    mockRepo.search.mockRejectedValue(new Error());
    await expect(service.execute({ title: 'X' })).rejects.toThrow();
  });
});
